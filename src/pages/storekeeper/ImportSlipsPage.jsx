import { useState, useEffect } from "react";
import { Search, Plus, MapPin, Building2, FileDown, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ImportSlipsTable from "@/components/ImportSlipsTable";
import { getImportNoteById, updateImportNote, createImportNote } from "@/api/importNotesApi";

export default function ImportSlipsPage() {
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
    code: "",
    importFrom: "",
    supplier: "",
    type: "SUPPLIER",
    totalAmout: 0,
    importById: "",
    serviceCenterId: ""
  });

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
          console.error("Error fetching import note detail:", error);
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
          console.error("Error fetching import note detail:", error);
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
                onClick={() => setIsCreateDialogOpen(true)}
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
                  console.error("Error updating import note:", error);
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
            code: "",
            importFrom: "",
            supplier: "",
            type: "SUPPLIER",
            totalAmout: 0,
            importById: "",
            serviceCenterId: ""
          });
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Tạo phiếu nhập mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-code">Mã phiếu *</Label>
                <Input
                  id="create-code"
                  value={createFormData.code}
                  onChange={(e) => setCreateFormData({ ...createFormData, code: e.target.value })}
                  placeholder="Nhập mã phiếu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-importFrom">Nguồn nhập *</Label>
                <Input
                  id="create-importFrom"
                  value={createFormData.importFrom}
                  onChange={(e) => setCreateFormData({ ...createFormData, importFrom: e.target.value })}
                  placeholder="Nhập nguồn nhập"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-supplier">Nhà cung cấp *</Label>
                <Input
                  id="create-supplier"
                  value={createFormData.supplier}
                  onChange={(e) => setCreateFormData({ ...createFormData, supplier: e.target.value })}
                  placeholder="Nhập nhà cung cấp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-type">Loại *</Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, type: value })}
                >
                  <SelectTrigger id="create-type">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">SUPPLIER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-totalAmout">Tổng giá trị *</Label>
                <Input
                  id="create-totalAmout"
                  type="number"
                  min="0"
                  value={createFormData.totalAmout}
                  onChange={(e) => setCreateFormData({ ...createFormData, totalAmout: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-importById">ID Người nhập</Label>
                <Input
                  id="create-importById"
                  value={createFormData.importById}
                  onChange={(e) => setCreateFormData({ ...createFormData, importById: e.target.value })}
                  placeholder="UUID người nhập (optional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-serviceCenterId">ID Trung tâm dịch vụ</Label>
              <Input
                id="create-serviceCenterId"
                value={createFormData.serviceCenterId}
                onChange={(e) => setCreateFormData({ ...createFormData, serviceCenterId: e.target.value })}
                placeholder="UUID trung tâm (optional)"
              />
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
                if (!createFormData.code || !createFormData.importFrom || !createFormData.supplier) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng điền đầy đủ các trường bắt buộc (Mã phiếu, Nguồn nhập, Nhà cung cấp)",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  setCreating(true);
                  
                  const createData = {
                    code: createFormData.code,
                    importFrom: createFormData.importFrom,
                    supplier: createFormData.supplier,
                    type: createFormData.type,
                    totalAmout: createFormData.totalAmout
                  };

                  // Only include optional fields if they have values
                  if (createFormData.importById) {
                    createData.importById = createFormData.importById;
                  }
                  if (createFormData.serviceCenterId) {
                    createData.serviceCenterId = createFormData.serviceCenterId;
                  }

                  const response = await createImportNote(createData);
                  
                  if (response.success) {
                    toast({
                      title: "Thành công",
                      description: "Tạo phiếu nhập mới thành công"
                    });
                    setIsCreateDialogOpen(false);
                    // Reset form
                    setCreateFormData({
                      code: "",
                      importFrom: "",
                      supplier: "",
                      type: "SUPPLIER",
                      totalAmout: 0,
                      importById: "",
                      serviceCenterId: ""
                    });
                    // Refresh table
                    if (window.refreshImportNotes) {
                      window.refreshImportNotes();
                    }
                  } else {
                    throw new Error(response.message || "Tạo thất bại");
                  }
                } catch (error) {
                  console.error("Error creating import note:", error);
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

