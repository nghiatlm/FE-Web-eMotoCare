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
    exportById: "",
    serviceCenterId: "",
    exportNoteStatus: "PENDING",
    partItemId: []
  });

  useEffect(() => {
    if (serviceCenterId) {
      setFormData(prev => ({ ...prev, serviceCenterId }));
    }
    if (staffId) {
      setFormData(prev => ({ ...prev, exportById: staffId }));
    }
  }, [serviceCenterId, staffId]);

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
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/storekeeper/export-slips")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FileUp className="h-8 w-8 text-primary" />
              Tạo phiếu xuất mới
            </h1>
            <p className="text-muted-foreground">
              Điền thông tin để tạo phiếu xuất mới
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Form Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu xuất</CardTitle>
              <CardDescription>Nhập các thông tin cơ bản của phiếu xuất</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold">Loại *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPLACEMENT">Thay thế</SelectItem>
                      <SelectItem value="TRANSFER_TO">Chuyển kho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exportNoteStatus" className="text-sm font-semibold">Trạng thái *</Label>
                  <Select
                    value={formData.exportNoteStatus}
                    onValueChange={(value) => setFormData({ ...formData, exportNoteStatus: value })}
                  >
                    <SelectTrigger id="exportNoteStatus">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exportTo" className="text-sm font-semibold">Chi nhánh nhận *</Label>
                <Select
                  value={formData.exportTo}
                  onValueChange={(value) => setFormData({ ...formData, exportTo: value })}
                  disabled={serviceCenters.length === 0}
                >
                  <SelectTrigger id="exportTo">
                    <SelectValue placeholder={serviceCenters.length === 0 ? "Đang tải..." : "Chọn chi nhánh nhận"}>
                      {formData.exportTo && (() => {
                        const selectedCenter = serviceCenters.find(c => c.id === formData.exportTo);
                        return selectedCenter ? (
                          <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-medium">{selectedCenter.name || selectedCenter.code || "Chi nhánh"}</span>
                            {selectedCenter.address && (
                              <span className="text-xs text-muted-foreground">{selectedCenter.address}</span>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {serviceCenters.length > 0 ? (
                      serviceCenters.map((center) => (
                        <SelectItem 
                          key={center.id} 
                          value={center.id}
                        >
                          <div className="flex flex-col gap-1 py-1">
                            <span className="font-medium">
                              {center.name || center.code || "Chi nhánh"}
                            </span>
                            {center.address && (
                              <span className="text-xs text-muted-foreground">
                                {center.address}
                              </span>
                            )}
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
                <p className="text-xs text-muted-foreground">
                  Chọn chi nhánh sẽ nhận phụ tùng
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalQuantity" className="text-sm font-semibold">Tổng số lượng *</Label>
                  <Input
                    id="totalQuantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.totalQuantity}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Tự động tính từ phụ tùng đã chọn</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totalValue" className="text-sm font-semibold">Tổng giá trị *</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.totalValue}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Tự động tính từ phụ tùng đã chọn</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-semibold">Ghi chú</Label>
                <Textarea
                  id="note"
                  placeholder="Nhập ghi chú cho phiếu xuất..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Part Items Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chọn phụ tùng *</CardTitle>
                  <CardDescription>Chọn các phụ tùng cần xuất</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllPartItems}
                  disabled={filteredPartItems.length === 0}
                >
                  {filteredPartItems.length > 0 && filteredPartItems.every(item => selectedPartItemIds.includes(item.id))
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm phụ tùng theo tên, mã, serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {loadingPartItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Đang tải phụ tùng...</span>
                  </div>
                ) : filteredPartItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {searchTerm ? "Không tìm thấy phụ tùng nào" : "Không có phụ tùng nào"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredPartItems.map((item) => {
                      const isSelected = selectedPartItemIds.includes(item.id);
                      const partImage = item.part?.image;
                      return (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handlePartItemToggle(item.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-primary" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            
                            {partImage ? (
                              <img
                                src={partImage}
                                alt={item.part?.name || item.part?.code || "Phụ tùng"}
                                className="h-16 w-16 rounded-lg object-cover border border-border/60 shadow-sm flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground bg-muted/30 flex-shrink-0">
                                N/A
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-primary">{item.part?.code || "—"}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.quantity || 1} bộ
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    maximumFractionDigits: 0,
                                  }).format(item.price || 0)}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground mt-1">{item.part?.name || "—"}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Serial: {item.serialNumber || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {partItems.length > 0 && (
                <div className="mt-4 p-2 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? `Hiển thị ${filteredPartItems.length} / ${partItems.length} phụ tùng`
                      : `Tổng cộng: ${partItems.length} phụ tùng`}
                  </p>
                </div>
              )}

              {selectedPartItemIds.length > 0 && (
                <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    Đã chọn {selectedPartItemIds.length} phụ tùng
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/storekeeper/export-slips")}
              disabled={creating}
            >
              Hủy
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo phiếu xuất"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

