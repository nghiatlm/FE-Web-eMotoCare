import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, FileUp, Plus, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ExportSlipsTable from "@/components/ExportSlipsTable";
import { getExportNoteById, updateExportNote } from "@/api/exportNotesApi";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getServiceCenterById } from "@/api/serviceCentersApi";

export default function ExportSlipsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [exportNoteDetail, setExportNoteDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [branchInfo, setBranchInfo] = useState(null);
  const [branchLoading, setBranchLoading] = useState(false);
  
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
    exportNoteStatus: ""
  });

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

  useEffect(() => {
    let isMounted = true;

    const fetchBranchInfo = async () => {
      if (!user?.accountResponse?.id) {
        if (isMounted) {
          setBranchInfo(null);
        }
        return;
      }

      try {
        setBranchLoading(true);
        const response = await getStaffByAccountId(user.accountResponse.id, { pageSize: 1 });
        const payload =
          response?.data?.rowDatas ||
          response?.data?.data ||
          response?.data ||
          response?.rowDatas ||
          response;
        const staff = Array.isArray(payload) ? payload[0] : payload;

        if (!staff) {
          if (isMounted) {
            setBranchInfo(null);
          }
          return;
        }

        let serviceCenter = staff.serviceCenter;

        if (!serviceCenter && staff.serviceCenterId) {
          try {
            const centerRes = await getServiceCenterById(staff.serviceCenterId);
            serviceCenter = centerRes?.data || centerRes;
          } catch (error) {
            console.error("Error fetching service center:", error);
          }
        }

        const managerName =
          [staff.firstName, staff.lastName].filter(Boolean).join(" ") ||
          staff.fullName ||
          staff.name ||
          staff.managerName ||
          user?.fullName ||
          "—";

        if (isMounted) {
          setBranchInfo({
            id: serviceCenter?.code || serviceCenter?.id || staff.serviceCenterId || "—",
            name: serviceCenter?.name || staff.serviceCenterName || "Chưa xác định",
            address: serviceCenter?.address || staff.serviceCenterAddress || "Chưa có địa chỉ",
            manager: managerName,
            phone: serviceCenter?.phone || serviceCenter?.contactNumber || staff.serviceCenterPhone || null,
          });
        }
      } catch (error) {
        console.error("Error fetching branch info:", error);
        if (isMounted) {
          setBranchInfo(null);
        }
      } finally {
        if (isMounted) {
          setBranchLoading(false);
        }
      }
    };

    fetchBranchInfo();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    window.openViewExportSlip = async (slip) => {
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-rose-100">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <FileUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Phiếu xuất</h1>
                  <p className="text-sm text-muted-foreground mt-1">Quản lý các phiếu xuất hàng cho appointments</p>
                </div>
              </div>
            </div>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/storekeeper/export-slips/create")}
            >
              <Plus className="h-4 w-4" />
              Tạo phiếu xuất
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">Quản lý các phiếu xuất hàng cho appointments</p>
          
          <div className="p-4 bg-card rounded-lg border border-border">
            {branchLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                </div>
              </div>
            ) : branchInfo ? (
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{branchInfo.name}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        Chi nhánh của tôi
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{branchInfo.address}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Quản lý: <span className="font-medium text-foreground">{branchInfo.manager}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Không tìm thấy thông tin chi nhánh. Vui lòng đảm bảo tài khoản có gán trung tâm dịch vụ.
              </div>
            )}
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

