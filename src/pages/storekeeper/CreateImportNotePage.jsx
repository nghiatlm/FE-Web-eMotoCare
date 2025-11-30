import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getParts, getPartTypes } from "@/api/partsApi";
import { getPartItems } from "@/api/partitemsApi";
import { createImportNote } from "@/api/importNotesApi";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";

import { ArrowLeft, FileDown, Package, Calendar, Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";

export default function CreateImportNotePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);

  const [serviceCenterId, setServiceCenterId] = useState("");
  const [staffId, setStaffId] = useState("");

  const [parts, setParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partTypes, setPartTypes] = useState([]);
  const [selectedPartTypeId, setSelectedPartTypeId] = useState("");
  const [openPartPopover, setOpenPartPopover] = useState(false);
  const [openPartTypePopover, setOpenPartTypePopover] = useState(false);
  const [partItemsByPart, setPartItemsByPart] = useState({});
  const [selectedPartItemId, setSelectedPartItemId] = useState("");

  const [form, setForm] = useState({
    importFrom: "",
    supplier: "",
    note: "",
    quantity: 1,
    serialNumber: "",
    price: 0,
    warrantyPeriod: 0, 
    warrantyStartDate: null,
    type: "SUPPLIER",
    newPartName: "",
    newPartImage: "",
  });
  const [hasManufacturerWarranty, setHasManufacturerWarranty] = useState(false);
  const [warrantyDateError, setWarrantyDateError] = useState("");
  const isTransferType = form.type === "TRANSFER_IN";

  // Helper function to get today's date without time
  const getTodayDateOnly = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];

        if (staffData) {
          if (staffData.serviceCenterId) {
            setServiceCenterId(staffData.serviceCenterId);
          }
          if (staffData.id) {
            setStaffId(staffData.id);
          }
        }
      } catch (error) {
        console.error("Error fetching staff info:", error);
      }
    };

    if (user) {
      fetchStaffInfo();
    }
  }, [user]);

  const fetchParts = useCallback(async () => {
    try {
      setLoadingParts(true);
      const res = await getParts({ page: 1, pageSize: 200, status: "ACTIVE" });
      const payload = res?.data || res;
      const list = payload?.rowDatas || payload?.data || payload || [];
      setParts(list);
    } catch (error) {
        console.error("Lỗi khi tải danh sách phụ tùng:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phụ tùng.",
        variant: "destructive",
      });
      setParts([]);
    } finally {
      setLoadingParts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const fetchPartItemsForPart = useCallback(
    async (partId) => {
      if (!partId || partItemsByPart[partId]) return;
      try {
        const res = await getPartItems({ partId, page: 1, pageSize: 100, status: "ACTIVE" });
        const payload = res?.data || res;
        const list = payload?.rowDatas || payload?.data || payload || [];
        setPartItemsByPart((prev) => ({
          ...prev,
          [partId]: list,
        }));
      } catch (error) {
        console.error("Lỗi khi tải Part Item theo partId:", error);
      }
    },
    [partItemsByPart],
  );

  useEffect(() => {
    const fetchPartTypesData = async () => {
      try {
        const res = await getPartTypes(1, 100);
        const payload = res?.data || res;
        const list = payload?.rowDatas || payload?.data || payload || [];
        setPartTypes(list);
      } catch (error) {
        console.error("Lỗi khi tải danh sách Part Type:", error);
        setPartTypes([]);
      }
    };

    fetchPartTypesData();
  }, []);

  const filteredParts = useMemo(() => {
    let result = parts;

    if (selectedPartTypeId) {
      result = result.filter((p) => {
        const typeIdFromObj = p.partType?.id;
        const typeIdFromField = p.partTypeId;
        return typeIdFromObj === selectedPartTypeId || typeIdFromField === selectedPartTypeId;
      });
    }

    return result;
  }, [parts, selectedPartTypeId]);

  const selectedPart = useMemo(
    () => filteredParts.find((p) => p.id === selectedPartId) || parts.find((p) => p.id === selectedPartId),
    [filteredParts, parts, selectedPartId],
  );

  const handleSubmit = async () => {
    if (!selectedPartId && !form.newPartName?.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn phụ tùng có sẵn hoặc nhập tên phụ tùng mới.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPartId && !selectedPartTypeId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn loại phụ tùng trước khi chọn phụ tùng.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPartId && !selectedPartTypeId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn loại phụ tùng.",
        variant: "destructive",
      });
      return;
    }

    if (hasManufacturerWarranty && !form.serialNumber) {
      toast({
        title: "Thiếu thông tin",
        description: "Phiếu nhập có bảo hành hãng, vui lòng nhập số serial.",
        variant: "destructive",
      });
      return;
    }

    if (!serviceCenterId || !staffId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được thông tin thủ kho hoặc trung tâm dịch vụ.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const warrantyPeriod = Number(form.warrantyPeriod) || 0;
      const basePrice = Number(form.price) || 0;

      let warantyStartDate = null;
      let warantyEndDate = null;

      if (hasManufacturerWarranty) {
        const start = form.warrantyStartDate
          ? new Date(form.warrantyStartDate)
          : new Date();
        warantyStartDate = start.toISOString();

        let endDate = start;
        if (warrantyPeriod > 0) {
          endDate = new Date(start);
          endDate.setMonth(endDate.getMonth() + warrantyPeriod);
        }
        warantyEndDate = endDate.toISOString();
      }

      const partId = selectedPartId || null;
      
      // Lấy name và image từ part (ưu tiên từ selectedPart)
      const partName = selectedPart?.name || form.newPartName?.trim() || "";
      const partImage = selectedPart?.image || form.newPartImage?.trim() || "";

      const importFromValue = form.importFrom?.trim() || "Chưa xác định";
      const supplierValue = form.supplier?.trim() || "Chưa xác định";

      const payload = {
        type: form.type || "SUPPLIER",
        importById: staffId,
        serviceCenterId,
        importFrom: importFromValue,
        supplier: supplierValue,
        note: form.note || undefined,
        partRequest: {
          partTypeId: selectedPartTypeId || null,
          partId: partId,
          name: partName,
          image: partImage,
          partItemRequest: [
            {
              quantity: Number(form.quantity) || 0,
              serialNumber: hasManufacturerWarranty ? form.serialNumber : null,
              price: basePrice,
              warrantyPeriod: warrantyPeriod,
              warantyStartDate,
              warantyEndDate,
              isManufacturerWarranty: hasManufacturerWarranty,
            },
          ],
        },
      };

      const response = await createImportNote(payload);

      if (response?.success || response?.statusCode === 200) {
        toast({
          title: "Thành công",
          description: response?.message || "Tạo phiếu nhập thành công.",
        });
        navigate("/storekeeper/import-slips");
      } else {
        throw new Error(response?.message || "Tạo phiếu nhập thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu nhập:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo phiếu nhập. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/storekeeper/import-slips")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileDown className="h-5 w-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Tạo phiếu nhập
                </h1>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Tạo phiếu nhập phụ tùng cho kho, kèm thông tin số lượng và bảo hành.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-border/70 shadow-sm lg:sticky lg:top-20 lg:self-start">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="h-4 w-4 text-primary" />
                Thông tin phiếu nhập
              </CardTitle>
              <CardDescription>
                Thông tin chung của phiếu nhập.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Loại phiếu</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger id="type" className="bg-background">
                    <SelectValue placeholder="Chọn loại phiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">Nhập hàng</SelectItem>
                    <SelectItem value="TRANSFER_IN">Nhận điều chuyển</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Chọn nguồn nhập: nhập từ nhà cung cấp hoặc nhận điều chuyển.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                  placeholder="Ghi chú thêm cho phiếu nhập (không bắt buộc)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Phụ tùng & thông tin bảo hành
              </CardTitle>
              <CardDescription>
                Chọn phụ tùng và thiết lập số lượng, giá, thời gian bảo hành.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partType">Loại phụ tùng *</Label>
                  <Popover open={openPartTypePopover} onOpenChange={setOpenPartTypePopover}>
                    <PopoverTrigger asChild>
                      <Button
                        id="partType"
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !selectedPartTypeId && "text-muted-foreground",
                        )}
                        disabled={partTypes.length === 0}
                      >
                        {selectedPartTypeId
                          ? partTypes.find((pt) => pt.id === selectedPartTypeId)?.name ||
                            "Selected part type"
                          : partTypes.length === 0
                            ? "Không có loại phụ tùng"
                            : "Chọn loại phụ tùng"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(420px,90vw)] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm loại phụ tùng..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy loại phụ tùng.</CommandEmpty>
                          <CommandGroup>
                            {partTypes.map((pt) => (
                              <CommandItem
                                key={pt.id}
                                value={pt.name}
                                onSelect={() => {
                                  setSelectedPartTypeId(pt.id);
                                  setSelectedPartId("");
                                  setOpenPartTypePopover(false);
                                }}
                              >
                                <span className="font-medium">{pt.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="part">Phụ tùng *</Label>
                  <Popover open={openPartPopover} onOpenChange={setOpenPartPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        id="part"
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !selectedPart && "text-muted-foreground",
                        )}
                        disabled={loadingParts || filteredParts.length === 0}
                      >
                        {selectedPart
                          ? selectedPart.name || "Phụ tùng"
                          : selectedPartId === "" && selectedPartTypeId
                          ? "Tạo phụ tùng mới"
                          : loadingParts
                            ? "Đang tải danh sách phụ tùng..."
                            : filteredParts.length === 0
                              ? "Không có phụ tùng cho loại này"
                              : "Chọn phụ tùng"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(420px,90vw)] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm phụ tùng theo tên hoặc mã..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy phụ tùng.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="new-part"
                              onSelect={() => {
                                setSelectedPartId("");
                                setOpenPartPopover(false);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-md border border-dashed border-primary/60 flex items-center justify-center bg-primary/5 text-primary flex-shrink-0 text-[10px]">
                                  +
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="font-medium text-sm text-primary">
                                    Tạo phụ tùng mới
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Phụ tùng chưa có trong hệ thống
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                            {filteredParts.map((part) => (
                              <CommandItem
                                key={part.id}
                                value={`${part.name} ${part.code}`}
                                onSelect={() => {
                                  setSelectedPartId(part.id);
                                  setOpenPartPopover(false);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  {part.image ? (
                                    <img
                                      src={part.image}
                                      alt={part.name || "Part image"}
                                      className="h-9 w-9 rounded-md object-cover border border-border/60 flex-shrink-0"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-md border border-dashed border-border/60 flex items-center justify-center bg-background/60 text-muted-foreground flex-shrink-0 text-[10px]">
                                      N/A
                                    </div>
                                  )}
                                  <div className="flex flex-col text-left">
                                    <span className="font-medium text-sm">
                                      {part.name || "Phụ tùng chưa có tên"}
                                    </span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {!selectedPartId && selectedPartTypeId && (
                <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold text-primary">
                      Thông tin phụ tùng mới
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPartName">Tên phụ tùng *</Label>
                    <Input
                      id="newPartName"
                      value={form.newPartName}
                      onChange={(e) => handleChange("newPartName", e.target.value)}
                      placeholder="Nhập tên phụ tùng mới"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPartImage">Hình ảnh (URL)</Label>
                    <Input
                      id="newPartImage"
                      value={form.newPartImage}
                      onChange={(e) => handleChange("newPartImage", e.target.value)}
                      placeholder="Nhập URL hình ảnh (tùy chọn)"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="hasManufacturerWarranty"
                    checked={hasManufacturerWarranty}
                    onCheckedChange={(checked) =>
                      setHasManufacturerWarranty(Boolean(checked))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="hasManufacturerWarranty">
                      Có bảo hành hãng
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Nếu chọn, bắt buộc nhập Serial và thông tin bảo hành. Nếu
                      không có bảo hành hãng thì không cần Serial và thông tin
                      bảo hành.
                    </p>
                  </div>
                </div>
              </div>

              {hasManufacturerWarranty && (
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Số serial *</Label>
                  <Input
                    id="serialNumber"
                    value={form.serialNumber}
                    onChange={(e) => handleChange("serialNumber", e.target.value)}
                    placeholder="Ví dụ: EVO200-GXS-001"
                  />
                </div>
              )}

              {selectedPart && (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 flex gap-4 items-start">
                  {selectedPart.image ? (
                    <img
                      src={selectedPart.image}
                      alt={selectedPart.name || selectedPart.code || "Part image"}
                      className="h-20 w-20 rounded-md object-cover border border-border/70 shadow-sm flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-md border border-dashed border-border/70 flex items-center justify-center bg-background/60 text-muted-foreground flex-shrink-0">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">
                      {selectedPart.name}
                    </p>
                    {selectedPart.partType?.name && (
                      <p className="text-muted-foreground">
                        Loại:{" "}
                        <span className="font-medium">
                          {selectedPart.partType.name}
                        </span>
                      </p>
                    )}
                    {selectedPart.description && (
                      <p className="text-muted-foreground">
                        {selectedPart.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Số lượng</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) =>
                      handleChange(
                        "quantity",
                        e.target.value ? parseInt(e.target.value) : 0,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Đơn giá (VND)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      handleChange(
                        "price",
                        e.target.value ? parseInt(e.target.value) : 0,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyPeriod">
                    Thời gian bảo hành (tháng)
                  </Label>
                  <Input
                    id="warrantyPeriod"
                    type="number"
                    min="0"
                    value={form.warrantyPeriod}
                    onChange={(e) =>
                      handleChange(
                        "warrantyPeriod",
                        e.target.value ? parseInt(e.target.value) : 0,
                      )
                    }
                  />
                </div>
              </div>

              {isTransferType && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Ngày bắt đầu bảo hành
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(
                            form.warrantyStartDate
                              ? new Date(form.warrantyStartDate)
                              : new Date(),
                            "dd/MM/yyyy"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={
                            form.warrantyStartDate
                              ? new Date(form.warrantyStartDate)
                              : new Date()
                          }
                          onSelect={(date) => {
                            if (!date) {
                              handleChange("warrantyStartDate", null);
                              setWarrantyDateError("");
                              return;
                            }
                            
                            const today = getTodayDateOnly();
                            const selectedDate = new Date(date);
                            selectedDate.setHours(0, 0, 0, 0);
                            
                            if (selectedDate < today) {
                              setWarrantyDateError("Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc ngày trong tương lai.");
                              return;
                            }
                            
                            setWarrantyDateError("");
                            handleChange(
                              "warrantyStartDate",
                              date.toISOString()
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {warrantyDateError ? (
                      <p className="text-xs text-red-500">
                        {warrantyDateError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nếu không chọn, hệ thống sẽ dùng ngày hiện tại làm ngày bắt đầu bảo hành.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
                    <p className="font-semibold text-foreground">Ngày hết hạn bảo hành</p>
                    <p className="text-primary text-base font-bold">
                      {format(
                        addMonths(
                          form.warrantyStartDate
                            ? new Date(form.warrantyStartDate)
                            : new Date(),
                          form.warrantyPeriod || 0
                        ),
                        "dd/MM/yyyy"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tự động tính bằng cách cộng thời gian bảo hành vào ngày bắt đầu.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/storekeeper/import-slips")}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Đang tạo..." : "Tạo phiếu nhập"}
          </Button>
        </div>
      </div>
    </div>
  );
}


