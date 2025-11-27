import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, ArrowLeft, Loader2, CheckSquare, Square, Search, Package, Building2, CircleDollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createExportNote } from "@/api/exportNotesApi";
import { getPartItemsByServiceCenter } from "@/api/partitemsApi";
import { getServiceCenters } from "@/api/serviceCentersApi";
import { useServiceCenter } from "@/hooks/useServiceCenter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CreateExportSlipPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { serviceCenterId, staffId } = useServiceCenter();
  
  // Part items state
  const [partItems, setPartItems] = useState([]);
  const [loadingPartItems, setLoadingPartItems] = useState(false);
  const [selectedPartItemIds, setSelectedPartItemIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Service centers state
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingServiceCenters, setLoadingServiceCenters] = useState(false);
  
  // Form state cho tạo phiếu xuất
  const [formData, setFormData] = useState({
    code: "",
    type: "REPLACEMENT",
    exportTo: "",
    totalQuantity: 0,
    totalValue: 0,
    note: "",
    partItemId: []
  });

  // State để lưu tất cả service centers (chưa lọc)
  const [allServiceCenters, setAllServiceCenters] = useState([]);

  // Fetch service centers list ngay từ đầu - không đợi serviceCenterId
  useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        setLoadingServiceCenters(true);
        const response = await getServiceCenters({ page: 1, pageSize: 100 });
        const centers = response?.data?.rowDatas || response?.data || [];
        setAllServiceCenters(centers);
        // Hiển thị tất cả ngay lập tức
        setServiceCenters(centers);
      } catch (error) {
        console.error("Error fetching service centers:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách chi nhánh",
          variant: "destructive"
        });
        setAllServiceCenters([]);
        setServiceCenters([]);
      } finally {
        setLoadingServiceCenters(false);
      }
    };

    fetchServiceCenters();
  }, [toast]);

  // Lọc bỏ chi nhánh hiện tại khi có serviceCenterId
  useEffect(() => {
    if (serviceCenterId && allServiceCenters.length > 0) {
      const filteredCenters = allServiceCenters.filter(center => {
        const centerId = String(center.id || "").trim();
        const currentId = String(serviceCenterId || "").trim();
        return centerId && centerId !== currentId;
      });
      setServiceCenters(filteredCenters);
    } else if (allServiceCenters.length > 0) {
      // Nếu chưa có serviceCenterId, hiển thị tất cả
      setServiceCenters(allServiceCenters);
    }
  }, [serviceCenterId, allServiceCenters]);

  const fetchPartItems = useCallback(async () => {
    try {
      setLoadingPartItems(true);
      console.log("🔄 Fetching part items for service center:", serviceCenterId);

      const response = await getPartItemsByServiceCenter(serviceCenterId);

      console.log("📦 Part Items API Response (full):", response);
      
      let items = [];
      let total = 0;
      
      if (Array.isArray(response?.data)) {
        items = response.data;
        total = response.data.length;
      } else if (response?.data?.rowDatas) {
        items = response.data.rowDatas;
        total = response.data.total || response.data.rowDatas.length;
      } else if (Array.isArray(response)) {
        items = response;
        total = response.length;
      } else if (response?.rowDatas) {
        items = response.rowDatas;
        total = response.total || response.rowDatas.length;
      }

      console.log("📋 Processed part items:", {
        itemsCount: items.length,
        total,
        firstItem: items[0],
      });

      if (items.length === 0) {
        console.warn("⚠️ No part items found in response");
      }

      setPartItems(items);
    } catch (error) {
      console.error("❌ Error fetching part items:", error);
      toast({
        title: "Lỗi",
        description: error?.message || error?.data?.message || "Không thể tải danh sách phụ tùng",
        variant: "destructive",
      });
      setPartItems([]);
    } finally {
      setLoadingPartItems(false);
    }
  }, [serviceCenterId, toast]);

  useEffect(() => {
    if (serviceCenterId) {
      console.log("Service center ID available, fetching part items...");
      fetchPartItems();
    }
  }, [serviceCenterId, fetchPartItems]);

  // Filter part items based on search term
  const filteredPartItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return partItems;
    }
    const searchLower = searchTerm.toLowerCase();
    return partItems.filter((item) => {
      const partName = item.part?.name?.toLowerCase() || "";
      const partCode = item.part?.code?.toLowerCase() || "";
      const serialNumber = item.serialNumber?.toLowerCase() || "";
      return (
        partName.includes(searchLower) ||
        partCode.includes(searchLower) ||
        serialNumber.includes(searchLower)
      );
    });
  }, [partItems, searchTerm]);

  const selectedPartItemsData = useMemo(() => {
    const selectedItems = partItems.filter(item => selectedPartItemIds.includes(item.id));
    const totalQty = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalVal = selectedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    return { totalQty, totalVal, selectedItems };
  }, [partItems, selectedPartItemIds]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalQuantity: selectedPartItemsData.totalQty,
      totalValue: selectedPartItemsData.totalVal,
      partItemId: selectedPartItemIds,
    }));
  }, [selectedPartItemsData.totalQty, selectedPartItemsData.totalVal, selectedPartItemIds]);

  const selectedDestination = useMemo(
    () => serviceCenters.find((center) => center.id === formData.exportTo),
    [serviceCenters, formData.exportTo],
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formattedTotalValue = useMemo(
    () => currencyFormatter.format(formData.totalValue || 0),
    [currencyFormatter, formData.totalValue],
  );

  // Handle part item selection
  const handlePartItemToggle = (partItemId) => {
    setSelectedPartItemIds(prev => {
      if (prev.includes(partItemId)) {
        return prev.filter(id => id !== partItemId);
      } else {
        return [...prev, partItemId];
      }
    });
  };

  // Handle select all part items (only filtered items)
  const handleSelectAllPartItems = () => {
    const filteredIds = filteredPartItems.map(item => item.id);
    const allFilteredSelected = filteredIds.every(id => selectedPartItemIds.includes(id));
    
    if (allFilteredSelected) {
      // Deselect all filtered items
      setSelectedPartItemIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered items
      setSelectedPartItemIds(prev => {
        const newIds = [...prev];
        filteredIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  };

  const handleSubmit = async () => {
    if (!serviceCenterId || !staffId) {
      toast({
        title: "Thiếu thông tin",
        description: "Không xác định được người xuất hoặc trung tâm dịch vụ.",
        variant: "destructive"
      });
      return;
    }

    // Validate exportTo
    if (!formData.exportTo || formData.exportTo === "") {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn chi nhánh nhận",
        variant: "destructive"
      });
      return;
    }

    // Validate part items
    if (!formData.partItemId || formData.partItemId.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một phụ tùng",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      
      const createData = {
        type: formData.type,
        exportTo: formData.exportTo,
        totalQuantity: formData.totalQuantity,
        exportById: staffId,
        serviceCenterId: serviceCenterId,
        totalValue: formData.totalValue,
        note: formData.note,
        partItemId: formData.partItemId,
        exportNoteStatus: "PROCESSING"
      };
      console.log(createData);
      const response = await createExportNote(createData);
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Tạo phiếu xuất mới thành công"
        });
        navigate("/storekeeper/export-slips");
      } else {
        throw new Error(response.message || "Tạo thất bại");
      }
    } catch (error) {
      console.error("Error creating export note:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo phiếu xuất mới",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_45%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="rounded-3xl border border-border/60 bg-card/80 shadow-xl shadow-primary/5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4 px-6 py-5">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate("/storekeeper/export-slips")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[240px] flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Kho GreenWheel</p>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-foreground">
                Tạo phiếu xuất mới
              </h1>
              <p className="text-sm text-muted-foreground">
                Chọn chi nhánh nhận cùng phụ tùng cần xuất. Hệ thống tự tính số lượng và giá trị.
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary sm:flex">
              <FileUp className="h-4 w-4" />
              Phiếu xuất kho
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Phụ tùng đã chọn</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{selectedPartItemIds.length}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Cần chọn tối thiểu 1 phụ tùng để tạo phiếu.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Tổng số lượng</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formData.totalQuantity}</p>
              </div>
              <div className="rounded-full bg-emerald-100/60 p-3 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Tự động cập nhật theo phụ tùng đã chọn.</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Tổng giá trị</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formattedTotalValue}</p>
              </div>
              <div className="rounded-full bg-amber-100/60 p-3 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Giá trị dựa trên giá phụ tùng trong kho.</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Điểm nhận</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {selectedDestination?.name || selectedDestination?.code || "Chưa chọn"}
                </p>
              </div>
              <div className="rounded-full bg-blue-100/70 p-3 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Vui lòng chọn chi nhánh nhận phụ tùng.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Thông tin phiếu xuất</CardTitle>
              <CardDescription>Điền thông tin cơ bản trước khi xác nhận.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold">Loại phiếu *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type" className="h-12 text-base">
                      <SelectValue placeholder="Chọn loại phiếu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPLACEMENT">Thay thế</SelectItem>
                      <SelectItem value="TRANSFER_TO">Chuyển kho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exportTo" className="text-sm font-semibold">Chi nhánh nhận *</Label>
                  <Select
                    value={formData.exportTo}
                    onValueChange={(value) => setFormData({ ...formData, exportTo: value })}
                    disabled={serviceCenters.length === 0}
                  >
                    <SelectTrigger id="exportTo" className="h-12 text-left">
                      <SelectValue placeholder={serviceCenters.length === 0 ? "Đang tải danh sách..." : "Chọn chi nhánh nhận"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[320px]">
                      {serviceCenters.length > 0 ? (
                        serviceCenters.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            <div className="flex flex-col gap-1 text-left">
                              <span className="font-medium">{center.name || center.code || "Chi nhánh"}</span>
                              {center.address && <span className="text-xs text-muted-foreground">{center.address}</span>}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {loadingServiceCenters ? "Đang tải..." : "Không có chi nhánh nào"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Hệ thống tự ẩn chi nhánh hiện tại để tránh chọn nhầm.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-border/70 p-4">
                  <Label htmlFor="totalQuantity" className="text-sm font-semibold">Tổng số lượng</Label>
                  <Input id="totalQuantity" type="number" min="0" value={formData.totalQuantity} readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Tính theo tổng phụ tùng đang được chọn ở kho bên dưới.
                  </p>
                </div>
                <div className="space-y-2 rounded-2xl border border-border/70 p-4">
                  <Label htmlFor="totalValue" className="text-sm font-semibold">Tổng giá trị (VND)</Label>
                  <Input id="totalValue" type="text" value={formattedTotalValue} readOnly className="bg-muted font-semibold" />
                  <p className="text-xs text-muted-foreground">
                    Tự động quy đổi theo đơn giá từng phụ tùng.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-semibold">Ghi chú</Label>
                <Textarea
                  id="note"
                  placeholder="Nhập hướng dẫn hoặc lưu ý cho phiếu xuất..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        <Card className="border-border/70 shadow-xl shadow-black/5">
          <CardHeader className="space-y-6">
            <div>
              <CardTitle>Kho phụ tùng</CardTitle>
              <CardDescription>Chọn phụ tùng cần xuất, có thể lọc theo tên, mã hoặc serial.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm phụ tùng theo tên, mã, serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-dashed"
                onClick={handleSelectAllPartItems}
                disabled={filteredPartItems.length === 0}
              >
                {filteredPartItems.length > 0 && filteredPartItems.every((item) => selectedPartItemIds.includes(item.id))
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả đang lọc"}
              </Button>
              <Badge variant="secondary" className="w-fit rounded-full bg-primary/10 text-primary">
                {selectedPartItemIds.length} đã chọn
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingPartItems ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tải danh sách phụ tùng...
              </div>
            ) : filteredPartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-12 text-center text-sm text-muted-foreground">
                {searchTerm ? (
                  <>
                    <p className="font-medium">Không tìm thấy phụ tùng phù hợp</p>
                    <p className="text-xs">Thử từ khóa khác hoặc xoá bộ lọc.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Kho chưa có phụ tùng khả dụng</p>
                    <p className="text-xs">Vui lòng kiểm tra lại sau.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredPartItems.map((item) => {
                  const isSelected = selectedPartItemIds.includes(item.id);
                  const partImage = item.part?.image;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handlePartItemToggle(item.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left transition-all",
                        "hover:border-primary/50 hover:bg-muted/40",
                        isSelected ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" : "border-border/60 bg-card",
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="relative">
                          {partImage ? (
                            <img
                              src={partImage}
                              alt={item.part?.name || item.part?.code || "Phụ tùng"}
                              className="h-20 w-20 rounded-xl border border-border/60 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                          <span
                            className={cn(
                              "absolute right-1 top-1 rounded-full border bg-card/80 p-1 text-muted-foreground",
                              isSelected ? "border-primary text-primary" : "border-border/60",
                            )}
                          >
                            {isSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-foreground">
                              {item.part?.name || "Phụ tùng chưa có tên"}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {item.quantity || 1} bộ
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Mã: {item.part?.code || "—"}</p>
                          <p className="text-sm font-semibold text-primary">
                            {currencyFormatter.format(item.price || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Serial: {item.serialNumber || "—"}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {partItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-between rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                <span>
                  {searchTerm
                    ? `Hiển thị ${filteredPartItems.length} / ${partItems.length} phụ tùng`
                    : `Tổng cộng: ${partItems.length} phụ tùng`}
                </span>
                {selectedPartItemIds.length > 0 && (
                  <span className="font-medium text-primary">Đã chọn {selectedPartItemIds.length} phụ tùng</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="min-w-[140px]"
            onClick={() => navigate("/storekeeper/export-slips")}
            disabled={creating}
          >
            Hủy
          </Button>
          <Button
            className="min-w-[180px] bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={creating}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo phiếu xuất"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

