import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, ArrowLeft, Loader2, CheckSquare, Square, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createExportNote } from "@/api/exportNotesApi";
import { getPartItems } from "@/api/partitemsApi";
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
  
  const [partItems, setPartItems] = useState([]);
  const [loadingPartItems, setLoadingPartItems] = useState(false);
  const [selectedPartItemIds, setSelectedPartItemIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingServiceCenters, setLoadingServiceCenters] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "REPLACEMENT",
    exportTo: "",
    totalQuantity: 0,
    totalValue: 0,
    note: "",
    partItemId: []
  });

  const [allServiceCenters, setAllServiceCenters] = useState([]);

  useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        setLoadingServiceCenters(true);
        const response = await getServiceCenters({ page: 1, pageSize: 100 });
        const centers = response?.data?.rowDatas || response?.data || [];
        setAllServiceCenters(centers);
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

    // Wrap trong try-catch để tránh unhandled promise rejection
    fetchServiceCenters().catch((error) => {
      // Error đã được handle trong fetchServiceCenters, chỉ log thôi
      console.error("Unhandled error in fetchServiceCenters:", error);
    });
  }, [toast]);

  useEffect(() => {
    if (serviceCenterId && allServiceCenters.length > 0) {
      const filteredCenters = allServiceCenters.filter(center => {
        const centerId = String(center.id || "").trim();
        const currentId = String(serviceCenterId || "").trim();
        return centerId && centerId !== currentId;
      });
      setServiceCenters(filteredCenters);
    } else if (allServiceCenters.length > 0) {
      setServiceCenters(allServiceCenters);
    }
  }, [serviceCenterId, allServiceCenters]);

  const fetchPartItems = useCallback(async () => {
    if (!serviceCenterId) {
      console.warn("Không có serviceCenterId, không thể fetch part items");
      setPartItems([]);
      return;
    }

    try {
      setLoadingPartItems(true);

      const response = await getPartItems({
        serviceCenterId: serviceCenterId,
        page: 1,
        pageSize: 1000
      });
      
      let items = [];
      
      if (Array.isArray(response?.data)) {
        items = response.data;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (response?.data?.rowDatas) {
        items = response.data.rowDatas;
      } else if (response?.rowDatas) {
        items = response.rowDatas;
      }

      setPartItems(items || []);
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
      // Wrap trong try-catch để tránh unhandled promise rejection
      fetchPartItems().catch((error) => {
        console.error("Error in fetchPartItems:", error);
        // Error đã được handle trong fetchPartItems, chỉ log thôi
      });
    }
  }, [serviceCenterId, fetchPartItems]);

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

  const handlePartItemToggle = (partItemId) => {
    setSelectedPartItemIds(prev => {
      if (prev.includes(partItemId)) {
        return prev.filter(id => id !== partItemId);
      } else {
        return [...prev, partItemId];
      }
    });
  };

  const handleSelectAllPartItems = () => {
    const filteredIds = filteredPartItems.map(item => item.id);
    const allFilteredSelected = filteredIds.every(id => selectedPartItemIds.includes(id));
    
    if (allFilteredSelected) {
      setSelectedPartItemIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
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

    if (!formData.exportTo || formData.exportTo === "") {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn chi nhánh nhận",
        variant: "destructive"
      });
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => navigate("/storekeeper/export-slips")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <FileUp className="h-5 w-5 text-primary" />
                Tạo phiếu xuất mới
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Chọn chi nhánh nhận cùng phụ tùng cần xuất. Hệ thống tự tính số lượng và giá trị.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Thông tin phiếu xuất</CardTitle>
            <CardDescription className="text-xs">Điền thông tin cơ bản trước khi xác nhận.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Loại phiếu <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type" className="h-10">
                    <SelectValue placeholder="Chọn loại phiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPLACEMENT">Thay thế</SelectItem>
                    <SelectItem value="TRANSFER_TO">Chuyển kho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exportTo" className="text-sm font-medium">Chi nhánh nhận <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.exportTo}
                  onValueChange={(value) => setFormData({ ...formData, exportTo: value })}
                  disabled={serviceCenters.length === 0}
                >
                  <SelectTrigger id="exportTo" className="h-10 text-left">
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
              <div className="space-y-2">
                <Label htmlFor="totalQuantity" className="text-sm font-medium">Tổng số lượng</Label>
                <Input 
                  id="totalQuantity" 
                  type="number" 
                  min="0" 
                  value={formData.totalQuantity} 
                  readOnly 
                  className="bg-slate-50/80 dark:bg-slate-800/50 h-10" 
                />
                <p className="text-xs text-muted-foreground">
                  Tính theo tổng phụ tùng đang được chọn ở kho bên dưới.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalValue" className="text-sm font-medium">Tổng giá trị (VND)</Label>
                <Input 
                  id="totalValue" 
                  type="text" 
                  value={formattedTotalValue} 
                  readOnly 
                  className="bg-slate-50/80 dark:bg-slate-800/50 font-semibold h-10" 
                />
                <p className="text-xs text-muted-foreground">
                  Tự động quy đổi theo đơn giá từng phụ tùng.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium">Ghi chú</Label>
              <Textarea
                id="note"
                placeholder="Nhập hướng dẫn hoặc lưu ý cho phiếu xuất..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800">
          <CardHeader className="pb-4 space-y-4">
            <div>
              <CardTitle className="text-lg font-semibold">Kho phụ tùng</CardTitle>
              <CardDescription className="text-xs">Chọn phụ tùng cần xuất, có thể lọc theo tên, mã hoặc serial.</CardDescription>
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
          <CardContent className="space-y-4">
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
              <div className="max-h-[500px] overflow-y-auto overflow-x-hidden pr-2" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid gap-3 md:grid-cols-2 pb-2">
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

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            className="min-w-[120px] h-10 border-slate-300 dark:border-slate-700"
            onClick={() => navigate("/storekeeper/export-slips")}
            disabled={creating}
          >
            Hủy
          </Button>
          <Button
            className="min-w-[160px] h-10 bg-primary hover:bg-primary/90"
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

