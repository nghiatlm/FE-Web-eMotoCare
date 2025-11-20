import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, FileUp, Plus, Eye, Printer, Trash2, Edit, Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ExportSlipsTable from "@/components/ExportSlipsTable";
import { createExportNote, getExportNoteById, updateExportNote } from "@/api/exportNotesApi";
import { getPartItems, getPartItemsByServiceCenter } from "@/api/partitemsApi";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { Checkbox } from "@/components/ui/checkbox";

export default function ExportSlipsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [exportNoteDetail, setExportNoteDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  // Part items state
  const [partItems, setPartItems] = useState([]);
  const [loadingPartItems, setLoadingPartItems] = useState(false);
  const [selectedPartItemIds, setSelectedPartItemIds] = useState([]);
  const [partItemsPage, setPartItemsPage] = useState(1);
  const [partItemsPageSize, setPartItemsPageSize] = useState(10);
  const [partItemsTotal, setPartItemsTotal] = useState(0);
  const [partItemsSearch, setPartItemsSearch] = useState("");
  const [serviceCenterId, setServiceCenterId] = useState("a805546d-b31d-11f0-9e95-c4efbb30f085");
  const [staffId, setStaffId] = useState("a7797a1f-c9d9-4b6b-a06f-d26bdc54e917");
  
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

  const [editFormData, setEditFormData] = useState({
    code: "",
    exportDate: "",
    type: "REPLACEMENT",
    exportTo: "",
    totalQuantity: 0,
    totalValue: 0,
    note: "",
    exportById: "",
    serviceCenterId: "",
    exportNoteStatus: "PENDING"
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

      // Call API lấy phụ tùng theo serviceCenterId
      const response = await getPartItemsByServiceCenter(serviceCenterId);

      console.log("📦 Part Items API Response (full):", response);
      
      // Xử lý response - có thể là array hoặc object có data/rowDatas
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
        console.warn("Full response:", JSON.stringify(response, null, 2));
      }

      setPartItems(items);
      setPartItemsTotal(total);
    } catch (error) {
      console.error("❌ Error fetching part items:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.data);
      console.error("Error message:", error.message);
      toast({
        title: "Lỗi",
        description: error?.message || error?.data?.message || "Không thể tải danh sách phụ tùng",
        variant: "destructive",
      });
      setPartItems([]);
      setPartItemsTotal(0);
    } finally {
      setLoadingPartItems(false);
    }
  }, [serviceCenterId, toast]);

  useEffect(() => {
    if (isCreateDialogOpen && serviceCenterId) {
      console.log("Dialog opened, fetching part items...");
      console.log("Current serviceCenterId:", serviceCenterId);
      fetchPartItems();
    } else {
      setPartItems([]);
      setSelectedPartItemIds([]);
      setPartItemsSearch("");
      setPartItemsPage(1);
    }
  }, [isCreateDialogOpen, serviceCenterId, fetchPartItems]);

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

  // Helper functions để format tên hiển thị
  const getTypeLabel = (type) => {
    const typeMap = {
      REPLACEMENT: "Thay thế",
      TRANSFER_TO: "Chuyển kho"
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Chờ xử lý",
      APPROVED: "Đã duyệt",
      EXPORTING: "Đang xuất",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy"
    };
    return statusMap[status] || status;
  };

  const currentBranch = {
    id: "BR-001",
    name: "GreenWheel - Chi nhánh Hồ Chí Minh",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    manager: "Dũng"
  };

  useEffect(() => {
    window.openViewExportSlip = async (slip) => {
      // Navigate to detail page instead of opening dialog
      if (slip?.rawData?.id) {
        navigate(`/storekeeper/export-slips/${slip.rawData.id}`);
      } else {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy ID phiếu xuất",
          variant: "destructive"
        });
      }
    };

    window.printExportSlip = (slip) => {
      console.log("Printing slip:", slip);
      window.print();
    };

    window.cancelExportSlip = (slip) => {
      if (confirm(`Bạn có chắc muốn hủy phiếu xuất ${slip.id}?`)) {
        console.log("Cancelling slip:", slip);
      }
    };

    window.openEditExportSlip = async (slip) => {
      setSelectedSlip(slip);
      setIsEditDialogOpen(true);
      
      // Fetch detail and populate form
      if (slip?.rawData?.id) {
        try {
          setLoadingDetail(true);
          const response = await getExportNoteById(slip.rawData.id);
          if (response.success && response.data) {
            const data = response.data;
            setExportNoteDetail(data);
            // Populate form
            setEditFormData({
              code: data.code || "",
              exportDate: data.exportDate ? new Date(data.exportDate).toISOString().slice(0, 16) : "",
              type: data.type || 0,
              exportTo: data.exportTo || "",
              totalQuantity: data.totalQuantity || 0,
              totalValue: data.totalValue || 0,
              note: data.note || "",
              exportById: typeof data.exportBy === 'object' ? data.exportBy?.id || "" : "",
              serviceCenterId: typeof data.serviceCenter === 'object' ? data.serviceCenter?.id || "" : "",
              exportNoteStatus: data.exportNoteStatus || data.status || "PENDING"
            });
          }
        } catch (error) {
          console.error("Error fetching export note detail:", error);
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin phiếu xuất",
            variant: "destructive"
          });
        } finally {
          setLoadingDetail(false);
        }
      }
    };

    return () => {
      delete window.openViewExportSlip;
      delete window.openEditExportSlip;
      delete window.printExportSlip;
      delete window.cancelExportSlip;
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileUp className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Phiếu xuất</h1>
            </div>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tạo phiếu xuất
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">Quản lý các phiếu xuất hàng cho appointments</p>
          
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{currentBranch.name}</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      Chi nhánh của tôi
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{currentBranch.address}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Quản lý: <span className="font-medium text-foreground">{currentBranch.manager}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm phiếu xuất"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Đã xuất</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            {(status || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setSearch("");
                }}
                className="text-primary hover:text-primary/90"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <ExportSlipsTable search={search} status={status} />
      </div>

      {/* Create Export Slip Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileUp className="h-6 w-6 text-primary" />
              Tạo phiếu xuất mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[80vh] overflow-y-auto">
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

            {/* <div className="space-y-2">
              <Label htmlFor="exportTo" className="text-sm font-semibold">Người nhận (Chi nhánh) *</Label>
              <Input
                id="exportTo"
                placeholder="Nhập người nhận"
                value={formData.exportTo}
                onChange={(e) => setFormData({ ...formData, exportTo: e.target.value })}
              />
            </div> */}

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

            {/* Part Items Selection */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Chọn phụ tùng *</Label>
                <div className="flex items-center gap-2">
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
              </div>
              
              {/* Search - Tạm thời comment lại */}
              {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm phụ tùng theo mã/tên..."
                  value={partItemsSearch}
                  onChange={(e) => setPartItemsSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setPartItemsPage(1);
                      fetchPartItems();
                    }
                  }}
                  className="pl-9"
                />
              </div> */}

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
                            
                            {/* Hình ảnh phụ tùng */}
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

              {/* Pagination - Tạm thời comment lại vì hiển thị hết */}
              {/* {partItemsTotal > partItemsPageSize && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Hiển thị {(partItemsPage - 1) * partItemsPageSize + 1} - {Math.min(partItemsPage * partItemsPageSize, partItemsTotal)} / {partItemsTotal} phụ tùng
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={partItemsPage <= 1 || loadingPartItems}
                      onClick={async () => {
                        setPartItemsPage(prev => prev - 1);
                        // fetchPartItems will be called by useEffect
                      }}
                    >
                      Trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={partItemsPage * partItemsPageSize >= partItemsTotal || loadingPartItems}
                      onClick={async () => {
                        setPartItemsPage(prev => prev + 1);
                        // fetchPartItems will be called by useEffect
                      }}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )} */}

              {partItems.length > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Tổng cộng: {partItemsTotal} phụ tùng
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
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="note" className="text-sm font-semibold">Ghi chú</Label>
              <Textarea
                id="note"
                placeholder="Nhập ghi chú cho phiếu xuất..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({
                  code: "",
                  type: "REPLACEMENT",
                  exportTo: "",
                  totalQuantity: 0,
                  totalValue: 0,
                  note: "",
                  exportById: staffId || "",
                  serviceCenterId: serviceCenterId || "",
                  exportNoteStatus: "PENDING",
                  partItemId: []
                });
                setSelectedPartItemIds([]);
                setPartItemsSearch("");
                setPartItemsPage(1);
              }}
              disabled={creating}
            >
              Hủy
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={async () => {
                // Validate required fields
                // if (!formData.exportTo) {
                //   toast({
                //     title: "Lỗi",
                //     description: "Vui lòng điền đầy đủ các trường bắt buộc (Người nhận)",
                //     variant: "destructive"
                //   });
                //   return;
                // }

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
                    setIsCreateDialogOpen(false);
                    // Reset form
                    setFormData({
                      code: "",
                      type: "REPLACEMENT",
                      exportTo: "",
                      totalQuantity: 0,
                      totalValue: 0,
                      note: "",
                      exportById: staffId || "",
                      serviceCenterId: serviceCenterId || "",
                      exportNoteStatus: "PENDING",
                      partItemId: []
                    });
                    setSelectedPartItemIds([]);
                    setPartItemsSearch("");
                    setPartItemsPage(1);
                    // Refresh table
                    if (window.refreshExportNotes) {
                      window.refreshExportNotes();
                    }
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
              }}
              disabled={creating}
            >
              {creating ? "Đang tạo..." : "Tạo phiếu xuất"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Export Slip Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setSelectedSlip(null);
          setExportNoteDetail(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Chi tiết phiếu xuất
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground text-sm">Đang tải chi tiết phiếu xuất...</p>
              </div>
            </div>
          ) : exportNoteDetail ? (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mã phiếu</p>
                  <p className="font-semibold text-foreground">{exportNoteDetail.code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loại</p>
                  <p className="font-semibold text-foreground">{getTypeLabel(exportNoteDetail.type) || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Người nhận</p>
                  <p className="font-semibold text-foreground">{exportNoteDetail.exportTo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ngày xuất</p>
                  <p className="font-semibold text-foreground">
                    {exportNoteDetail.exportDate 
                      ? new Date(exportNoteDetail.exportDate).toLocaleString('vi-VN') 
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Export By & Service Center */}
              {(exportNoteDetail.exportBy || exportNoteDetail.serviceCenter) && (
                <div className="grid grid-cols-2 gap-4">
                  {exportNoteDetail.exportBy && (
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Người xuất</p>
                      <div className="space-y-2">
                        {typeof exportNoteDetail.exportBy === 'object' ? (
                          <>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tên:</span>{" "}
                              {exportNoteDetail.exportBy.firstName} {exportNoteDetail.exportBy.lastName}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Chức vụ:</span>{" "}
                              {exportNoteDetail.exportBy.position || "N/A"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Mã nhân viên:</span>{" "}
                              {exportNoteDetail.exportBy.staffCode || "N/A"}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm">{exportNoteDetail.exportBy}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {exportNoteDetail.serviceCenter && (
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Trung tâm dịch vụ</p>
                      <div className="space-y-2">
                        {typeof exportNoteDetail.serviceCenter === 'object' ? (
                          <>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tên:</span>{" "}
                              {exportNoteDetail.serviceCenter.name || "N/A"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Mã:</span>{" "}
                              {exportNoteDetail.serviceCenter.code || "N/A"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Địa chỉ:</span>{" "}
                              {exportNoteDetail.serviceCenter.address || "N/A"}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm">{exportNoteDetail.serviceCenter}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Tổng số lượng</p>
                  <p className="text-2xl font-bold text-primary">{exportNoteDetail.totalQuantity || 0}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-primary">
                    {exportNoteDetail.totalValue?.toLocaleString('vi-VN') || "0"}đ
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                <p className="text-lg font-semibold text-foreground">
                  {getStatusLabel(exportNoteDetail.exportNoteStatus || exportNoteDetail.status || "PENDING")}
                </p>
              </div>

              {/* Note */}
              {exportNoteDetail.note && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">Ghi chú</p>
                  <p className="text-sm text-muted-foreground">{exportNoteDetail.note}</p>
                </div>
              )}

              {/* Additional Info */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm font-semibold text-foreground mb-2">Thông tin bổ sung</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>{" "}
                    <span className="font-medium">{exportNoteDetail.id || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">
                Không thể tải chi tiết phiếu xuất
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Export Slip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedSlip(null);
          setExportNoteDetail(null);
          setEditFormData({
            code: "",
            exportDate: "",
            type: 0,
            exportTo: "",
            totalQuantity: 0,
            totalValue: 0,
            note: "",
            exportById: "",
            serviceCenterId: "",
            exportNoteStatus: "PENDING"
          });
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-primary" />
              Chỉnh sửa phiếu xuất
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground text-sm">Đang tải thông tin phiếu xuất...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Mã phiếu *</Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    placeholder="Nhập mã phiếu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-exportDate">Ngày xuất *</Label>
                  <Input
                    id="edit-exportDate"
                    type="datetime-local"
                    value={editFormData.exportDate}
                    onChange={(e) => setEditFormData({ ...editFormData, exportDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Loại *</Label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPLACEMENT">Thay thế</SelectItem>
                      <SelectItem value="TRANSFER_TO">Chuyển kho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-exportTo">Người nhận *</Label>
                  <Input
                    id="edit-exportTo"
                    value={editFormData.exportTo}
                    onChange={(e) => setEditFormData({ ...editFormData, exportTo: e.target.value })}
                    placeholder="Nhập người nhận"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalQuantity">Tổng số lượng *</Label>
                  <Input
                    id="edit-totalQuantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editFormData.totalQuantity}
                    onChange={(e) => setEditFormData({ ...editFormData, totalQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-totalValue">Tổng giá trị *</Label>
                  <Input
                    id="edit-totalValue"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editFormData.totalValue}
                    onChange={(e) => setEditFormData({ ...editFormData, totalValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-exportById">ID Người xuất</Label>
                  <Input
                    id="edit-exportById"
                    value={editFormData.exportById}
                    onChange={(e) => setEditFormData({ ...editFormData, exportById: e.target.value })}
                    placeholder="UUID người xuất (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-serviceCenterId">ID Trung tâm dịch vụ</Label>
                  <Input
                    id="edit-serviceCenterId"
                    value={editFormData.serviceCenterId}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceCenterId: e.target.value })}
                    placeholder="UUID trung tâm (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-exportNoteStatus">Trạng thái *</Label>
                  <Select
                    value={editFormData.exportNoteStatus}
                    onValueChange={(value) => setEditFormData({ ...editFormData, exportNoteStatus: value })}
                  >
                    <SelectTrigger id="edit-exportNoteStatus">
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
                <Label htmlFor="edit-note">Ghi chú</Label>
                <Textarea
                  id="edit-note"
                  placeholder="Nhập ghi chú cho phiếu xuất..."
                  value={editFormData.note}
                  onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                if (!selectedSlip?.rawData?.id) {
                  toast({
                    title: "Lỗi",
                    description: "Không tìm thấy ID phiếu xuất",
                    variant: "destructive"
                  });
                  return;
                }

                // Validate required fields
                if (!editFormData.code || !editFormData.exportDate || !editFormData.exportTo) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng điền đầy đủ các trường bắt buộc (Mã phiếu, Ngày xuất, Người nhận)",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  setSaving(true);
                  // Convert datetime-local to ISO string
                  const exportDateISO = new Date(editFormData.exportDate).toISOString();
                  
                  const updateData = {
                    code: editFormData.code,
                    exportDate: exportDateISO,
                    type: editFormData.type,
                    exportTo: editFormData.exportTo,
                    totalQuantity: editFormData.totalQuantity,
                    totalValue: editFormData.totalValue,
                    exportNoteStatus: editFormData.exportNoteStatus
                  };

                  // Only include optional fields if they have values
                  if (editFormData.note) {
                    updateData.note = editFormData.note;
                  }
                  if (editFormData.exportById) {
                    updateData.exportById = editFormData.exportById;
                  }
                  if (editFormData.serviceCenterId) {
                    updateData.serviceCenterId = editFormData.serviceCenterId;
                  }

                  const response = await updateExportNote(selectedSlip.rawData.id, updateData);
                  
                  if (response.success) {
                    toast({
                      title: "Thành công",
                      description: "Cập nhật phiếu xuất thành công"
                    });
                    setIsEditDialogOpen(false);
                    // Refresh table
                    if (window.refreshExportNotes) {
                      window.refreshExportNotes();
                    }
                  } else {
                    throw new Error(response.message || "Cập nhật thất bại");
                  }
                } catch (error) {
                  console.error("Error updating export note:", error);
                  toast({
                    title: "Lỗi",
                    description: error.message || "Không thể cập nhật phiếu xuất",
                    variant: "destructive"
                  });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || loadingDetail}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

