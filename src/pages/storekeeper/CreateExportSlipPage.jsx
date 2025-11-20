import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, ArrowLeft, Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createExportNote } from "@/api/exportNotesApi";
import { getPartItemsByServiceCenter } from "@/api/partitemsApi";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateExportSlipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  
  // Part items state
  const [partItems, setPartItems] = useState([]);
  const [loadingPartItems, setLoadingPartItems] = useState(false);
  const [selectedPartItemIds, setSelectedPartItemIds] = useState([]);
  const [serviceCenterId, setServiceCenterId] = useState("");
  const [staffId, setStaffId] = useState("");
  
  // Form state cho tạo phiếu xuất
  const [formData, setFormData] = useState({
    code: "",
    type: "REPLACEMENT",
    exportTo: "string",
    totalQuantity: 0,
    totalValue: 0,
    note: "",
    exportById: "",
    serviceCenterId: "",
    exportNoteStatus: "PENDING",
    partItemId: []
  });

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
            setFormData(prev => ({ ...prev, serviceCenterId: staffData.serviceCenterId }));
          }
          if (staffData.id) {
            setStaffId(staffData.id);
            setFormData(prev => ({ ...prev, exportById: staffData.id }));
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

  // Handle select all part items
  const handleSelectAllPartItems = () => {
    if (selectedPartItemIds.length === partItems.length) {
      setSelectedPartItemIds([]);
    } else {
      setSelectedPartItemIds(partItems.map(item => item.id));
    }
  };

  const handleSubmit = async () => {
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
                  disabled={partItems.length === 0}
                >
                  {selectedPartItemIds.length === partItems.length && partItems.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {loadingPartItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Đang tải phụ tùng...</span>
                  </div>
                ) : partItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Không có phụ tùng nào
                  </div>
                ) : (
                  <div className="divide-y">
                    {partItems.map((item) => {
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
                    Tổng cộng: {partItems.length} phụ tùng
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

