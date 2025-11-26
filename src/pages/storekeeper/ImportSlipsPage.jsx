import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MapPin, Building2, FileDown, Eye, Edit, Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ImportSlipsTable from "@/components/ImportSlipsTable";
import { getImportNoteById, updateImportNote, createImportNote } from "@/api/importNotesApi";
import { getPartItems, getPartItemsByServiceCenter } from "@/api/partitemsApi";
import { Checkbox } from "@/components/ui/checkbox";

export default function ImportSlipsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [importNoteDetail, setImportNoteDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    code: "",
    importDate: "",
    importFrom: "",
    supplier: "",
    type: "SUPPLIER",
    totalAmout: 0,
    importById: "",
    serviceCenterId: "",
    importNoteStatus: "PENDING"
  });

  // Create form state
  const [createFormData, setCreateFormData] = useState({
    importFrom: "Bảo Trân",
    supplier: "Bảo Trân",
    type: "SUPPLIER",
    totalQuantity: 0,
    totalAmout: 0,
    importById: "a7797a1f-c9d9-4b6b-a06f-d26bdc54e917",
    serviceCenterId: "a805546d-b31d-11f0-9e95-c4efbb30f085",
    importNoteStatus: "PENDING",
    partItemId: [],
    note: ""
  });

  // Part items state
  const [partItems, setPartItems] = useState([]);
  const [loadingPartItems, setLoadingPartItems] = useState(false);
  const [selectedPartItemIds, setSelectedPartItemIds] = useState([]);
  const [partItemsTotal, setPartItemsTotal] = useState(0);
  
  // Hardcoded IDs (user sẽ set cứng)
  const [importById] = useState("a7797a1f-c9d9-4b6b-a06f-d26bdc54e917"); // staffId
  const [serviceCenterId] = useState("a805546d-b31d-11f0-9e95-c4efbb30f085"); // serviceCenterId

  // Fetch part items
  const fetchPartItems = useCallback(async () => {
    try {
      setLoadingPartItems(true);

      // Call API lấy phụ tùng theo serviceCenterId
      const response = await getPartItemsByServiceCenter(serviceCenterId);
      
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

      setPartItems(items);
      setPartItemsTotal(total);
    } catch (error) {
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

  // Fetch part items when create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && serviceCenterId) {
      fetchPartItems();
    } else {
      // Reset when dialog closes
      setPartItems([]);
      setSelectedPartItemIds([]);
    }
  }, [isCreateDialogOpen, serviceCenterId, fetchPartItems]);

  // Calculate total quantity and amount from selected part items
  const selectedPartItemsData = useMemo(() => {
    const selectedItems = partItems.filter(item => selectedPartItemIds.includes(item.id));
    const totalQty = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalAmount = selectedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    return { totalQty, totalAmount, selectedItems };
  }, [partItems, selectedPartItemIds]);

  // Update form data when selected items change
  useEffect(() => {
    setCreateFormData(prev => ({
      ...prev,
      totalQuantity: selectedPartItemsData.totalQty,
      totalAmout: selectedPartItemsData.totalAmount,
      partItemId: selectedPartItemIds,
    }));
  }, [selectedPartItemsData.totalQty, selectedPartItemsData.totalAmount, selectedPartItemIds]);

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

  const currentBranch = {
    id: "BR-001",
    name: "GreenWheel - Chi nhánh Hồ Chí Minh",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    manager: "Dũng"
  };

  // Setup window functions for table interactions
  useEffect(() => {
    window.openViewImportSlip = async (slip) => {
      setSelectedSlip(slip);
      setIsViewDialogOpen(true);
      
      // Fetch detail from API using the UUID from rawData
      if (slip?.rawData?.id) {
        try {
          setLoadingDetail(true);
          const response = await getImportNoteById(slip.rawData.id);
          if (response.success && response.data) {
            setImportNoteDetail(response.data);
          }
        } catch (error) {
          setImportNoteDetail(null);
        } finally {
          setLoadingDetail(false);
        }
      }
    };

    window.openEditImportSlip = async (slip) => {
      setSelectedSlip(slip);
      setIsEditDialogOpen(true);
      
      // Fetch detail and populate form
      if (slip?.rawData?.id) {
        try {
          setLoadingDetail(true);
          const response = await getImportNoteById(slip.rawData.id);
          if (response.success && response.data) {
            const data = response.data;
            setImportNoteDetail(data);
            // Populate form
            setEditFormData({
              code: data.code || "",
              importDate: data.importDate ? new Date(data.importDate).toISOString().slice(0, 16) : "",
              importFrom: data.importFrom || "",
              supplier: data.supplier || "",
              type: data.type || "SUPPLIER",
              totalAmout: data.totalAmout || 0,
              importById: typeof data.importBy === 'object' ? data.importBy?.id || "" : "",
              serviceCenterId: typeof data.serviceCenter === 'object' ? data.serviceCenter?.id || "" : "",
              importNoteStatus: data.importNoteStatus || data.status || "PENDING"
            });
          }
        } catch (error) {
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin phiếu nhập",
            variant: "destructive"
          });
        } finally {
          setLoadingDetail(false);
        }
      }
    };

    return () => {
      delete window.openViewImportSlip;
      delete window.openEditImportSlip;
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileDown className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Phiếu nhập</h1>
          </div>
          <p className="text-muted-foreground mb-4">Quản lý các phiếu nhập hàng vào kho</p>
          
          {/* Chi nhánh hiện tại */}
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
                placeholder="Tìm kiếm phiếu nhập"
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
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
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

            <div className="flex items-center gap-3 ml-auto">
              <Button
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => navigate("/storekeeper/import-slips/create")}
              >
                <Plus className="h-4 w-4" />
                Tạo phiếu nhập mới
              </Button>
            </div>
          </div>
        </div>

        <ImportSlipsTable search={search} status={status} />
      </div>

      {/* View Import Slip Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setSelectedSlip(null);
          setImportNoteDetail(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Chi tiết phiếu nhập
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground text-sm">Đang tải chi tiết phiếu nhập...</p>
              </div>
            </div>
          ) : importNoteDetail ? (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mã phiếu</p>
                  <p className="font-semibold text-foreground">{importNoteDetail.code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loại</p>
                  <p className="font-semibold text-foreground">{importNoteDetail.type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nhà cung cấp</p>
                  <p className="font-semibold text-foreground">{importNoteDetail.supplier || importNoteDetail.importFrom || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ngày nhập</p>
                  <p className="font-semibold text-foreground">
                    {importNoteDetail.importDate 
                      ? new Date(importNoteDetail.importDate).toLocaleString('vi-VN') 
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Import By & Service Center */}
              {(importNoteDetail.importBy || importNoteDetail.serviceCenter) && (
                <div className="grid grid-cols-2 gap-4">
                  {importNoteDetail.importBy && (
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Người nhập</p>
                      <div className="space-y-2">
                        {typeof importNoteDetail.importBy === 'object' ? (
                          <>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tên:</span>{" "}
                              {importNoteDetail.importBy.firstName} {importNoteDetail.importBy.lastName}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Chức vụ:</span>{" "}
                              {importNoteDetail.importBy.position || "N/A"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Mã nhân viên:</span>{" "}
                              {importNoteDetail.importBy.staffCode || "N/A"}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm">{importNoteDetail.importBy}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {importNoteDetail.serviceCenter && (
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Trung tâm dịch vụ</p>
                      <div className="space-y-2">
                        {typeof importNoteDetail.serviceCenter === 'object' ? (
                          <>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tên:</span>{" "}
                              {importNoteDetail.serviceCenter.name || "N/A"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Mã:</span>{" "}
                              {importNoteDetail.serviceCenter.code || "N/A"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Địa chỉ:</span>{" "}
                              {importNoteDetail.serviceCenter.address || "N/A"}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm">{importNoteDetail.serviceCenter}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-primary">
                    {importNoteDetail.totalAmout?.toLocaleString('vi-VN') || "0"}đ
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Nguồn nhập</p>
                  <p className="text-lg font-semibold text-foreground">
                    {importNoteDetail.importFrom || "N/A"}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm font-semibold text-foreground mb-2">Thông tin bổ sung</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>{" "}
                    <span className="font-medium">{importNoteDetail.id || "N/A"}</span>
                  </div>
                  {importNoteDetail.note && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Ghi chú:</span>{" "}
                      <span className="font-medium">{importNoteDetail.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">
                Không thể tải chi tiết phiếu nhập
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

      {/* Edit Import Slip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedSlip(null);
          setImportNoteDetail(null);
          setEditFormData({
            code: "",
            importDate: "",
            importFrom: "",
            supplier: "",
            type: "SUPPLIER",
            totalAmout: 0,
            importById: "",
            serviceCenterId: "",
            importNoteStatus: "PENDING"
          });
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-primary" />
              Chỉnh sửa phiếu nhập
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground text-sm">Đang tải thông tin phiếu nhập...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã phiếu *</Label>
                  <Input
                    id="code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    placeholder="Nhập mã phiếu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importDate">Ngày nhập *</Label>
                  <Input
                    id="importDate"
                    type="datetime-local"
                    value={editFormData.importDate}
                    onChange={(e) => setEditFormData({ ...editFormData, importDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="importFrom">Nguồn nhập *</Label>
                  <Input
                    id="importFrom"
                    value={editFormData.importFrom}
                    onChange={(e) => setEditFormData({ ...editFormData, importFrom: e.target.value })}
                    placeholder="Nhập nguồn nhập"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Nhà cung cấp *</Label>
                  <Input
                    id="supplier"
                    value={editFormData.supplier}
                    onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
                    placeholder="Nhập nhà cung cấp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Loại *</Label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPPLIER">SUPPLIER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmout">Tổng giá trị *</Label>
                  <Input
                    id="totalAmout"
                    type="number"
                    min="0"
                    value={editFormData.totalAmout}
                    onChange={(e) => setEditFormData({ ...editFormData, totalAmout: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="importById">ID Người nhập</Label>
                  <Input
                    id="importById"
                    value={editFormData.importById}
                    onChange={(e) => setEditFormData({ ...editFormData, importById: e.target.value })}
                    placeholder="UUID người nhập (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceCenterId">ID Trung tâm dịch vụ</Label>
                  <Input
                    id="serviceCenterId"
                    value={editFormData.serviceCenterId}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceCenterId: e.target.value })}
                    placeholder="UUID trung tâm (optional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="importNoteStatus">Trạng thái *</Label>
                <Select
                  value={editFormData.importNoteStatus}
                  onValueChange={(value) => setEditFormData({ ...editFormData, importNoteStatus: value })}
                >
                  <SelectTrigger id="importNoteStatus">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
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
                    description: "Không tìm thấy ID phiếu nhập",
                    variant: "destructive"
                  });
                  return;
                }

                // Validate required fields
                if (!editFormData.code || !editFormData.importDate || !editFormData.importFrom || !editFormData.supplier) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng điền đầy đủ các trường bắt buộc",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  setSaving(true);
                  // Convert datetime-local to ISO string
                  const importDateISO = new Date(editFormData.importDate).toISOString();
                  
                  const updateData = {
                    code: editFormData.code,
                    importDate: importDateISO,
                    importFrom: editFormData.importFrom,
                    supplier: editFormData.supplier,
                    type: editFormData.type,
                    totalAmout: editFormData.totalAmout,
                    importNoteStatus: editFormData.importNoteStatus
                  };

                  // Only include optional fields if they have values
                  if (editFormData.importById) {
                    updateData.importById = editFormData.importById;
                  }
                  if (editFormData.serviceCenterId) {
                    updateData.serviceCenterId = editFormData.serviceCenterId;
                  }

                  const response = await updateImportNote(selectedSlip.rawData.id, updateData);
                  
                  if (response.success) {
                    toast({
                      title: "Thành công",
                      description: "Cập nhật phiếu nhập thành công"
                    });
                    setIsEditDialogOpen(false);
                    // Refresh table
                    if (window.refreshImportNotes) {
                      window.refreshImportNotes();
                    }
                  } else {
                    throw new Error(response.message || "Cập nhật thất bại");
                  }
                } catch (error) {
                  toast({
                    title: "Lỗi",
                    description: error.message || "Không thể cập nhật phiếu nhập",
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

      {/* Create Import Slip Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setCreateFormData({
            importFrom: "",
            supplier: "",
            type: "SUPPLIER",
            totalQuantity: 0,
            totalAmout: 0,
            importById: "",
            serviceCenterId: "",
            partItemId: []
          });
          setSelectedPartItemIds([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Tạo phiếu nhập mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-importFrom" className="text-sm font-semibold">Nguồn nhập *</Label>
                <Input
                  id="create-importFrom"
                  value={createFormData.importFrom}
                  onChange={(e) => setCreateFormData({ ...createFormData, importFrom: e.target.value })}
                  placeholder="Nhập nguồn nhập"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-supplier" className="text-sm font-semibold">Nhà cung cấp *</Label>
                <Input
                  id="create-supplier"
                  value={createFormData.supplier}
                  onChange={(e) => setCreateFormData({ ...createFormData, supplier: e.target.value })}
                  placeholder="Nhập nhà cung cấp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type" className="text-sm font-semibold">Loại *</Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, type: value })}
                >
                  <SelectTrigger id="create-type">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">Nhà cung cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-totalQuantity" className="text-sm font-semibold">Tổng số lượng *</Label>
                <Input
                  id="create-totalQuantity"
                  type="number"
                  min="0"
                  value={createFormData.totalQuantity}
                  readOnly
                  className="bg-muted"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Tự động tính từ phụ tùng đã chọn</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-totalAmout" className="text-sm font-semibold">Tổng giá trị *</Label>
                <Input
                  id="create-totalAmout"
                  type="number"
                  min="0"
                  value={createFormData.totalAmout}
                  readOnly
                  className="bg-muted"
                  placeholder="0"
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
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={creating}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                // Validate required fields
                if (!createFormData.importFrom || !createFormData.supplier) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng điền đầy đủ các trường bắt buộc (Nguồn nhập, Nhà cung cấp)",
                    variant: "destructive"
                  });
                  return;
                }

                // Validate part items
                if (!createFormData.partItemId || createFormData.partItemId.length === 0) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng chọn ít nhất một phụ tùng",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  setCreating(true);
                  
                  // Tính lại totalQuantity và totalAmount từ các phụ tùng đã chọn để đảm bảo chính xác
                  const selectedItems = partItems.filter(item => selectedPartItemIds.includes(item.id));
                  const calculatedTotalQuantity = selectedItems.reduce((sum, item) => {
                    return sum + (item.quantity || 1);
                  }, 0);
                  const calculatedTotalAmount = selectedItems.reduce((sum, item) => {
                    return sum + ((item.price || 0) * (item.quantity || 1));
                  }, 0);
                  
                  const createData = {
                    importFrom: createFormData.importFrom,
                    supplier: createFormData.supplier,
                    type: createFormData.type,
                    totalQuantity: calculatedTotalQuantity,
                    totalAmout: calculatedTotalAmount,
                    partItemId: selectedPartItemIds,
                    importById: createFormData.importById,
                    serviceCenterId: createFormData.serviceCenterId,
                  };

                  const response = await createImportNote(createData);
                  
                  if (response.success) {
                    toast({
                      title: "Thành công",
                      description: "Tạo phiếu nhập mới thành công"
                    });
                    setIsCreateDialogOpen(false);
                    // Reset form
                    setCreateFormData({
                      importFrom: "",
                      supplier: "",
                      type: "SUPPLIER",
                      totalQuantity: 0,
                      totalAmout: 0,
                      partItemId: []
                    });
                    setSelectedPartItemIds([]);
                    // Refresh table
                    if (window.refreshImportNotes) {
                      window.refreshImportNotes();
                    }
                  } else {
                    throw new Error(response.message || "Tạo thất bại");
                  }
                } catch (error) {
                  toast({
                    title: "Lỗi",
                    description: error.message || "Không thể tạo phiếu nhập mới",
                    variant: "destructive"
                  });
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating}
              className="bg-primary hover:bg-primary/90"
            >
              {creating ? "Đang tạo..." : "Tạo phiếu nhập"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

