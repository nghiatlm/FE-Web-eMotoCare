import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MapPin, Building2, FileDown, Edit, Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ImportSlipsTable from "@/components/ImportSlipsTable";
import { getImportNoteById, updateImportNote, createImportNote } from "@/api/importNotesApi";
import { getPartItemsByServiceCenter } from "@/api/partitemsApi";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getServiceCenterById } from "@/api/serviceCentersApi";

export default function ImportSlipsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [branchInfo, setBranchInfo] = useState(null);
  const [branchLoading, setBranchLoading] = useState(false);
  const [serviceCenterId, setServiceCenterId] = useState(null);
  const [staffId, setStaffId] = useState("");

  const [editFormData, setEditFormData] = useState({
    code: "",
    importDate: "",
    importFrom: "",
    supplier: "",
    type: "SUPPLIER",
    totalAmout: 0,
    importById: "",
    serviceCenterId: ""
  });

  const [createFormData, setCreateFormData] = useState({
    importFrom: "",
    supplier: "",
    type: "SUPPLIER",
    totalQuantity: 0,
    totalAmout: 0,
    importById: "",
    serviceCenterId: "",
    partItemId: [],
    note: ""
  });

  const [partItems, setPartItems] = useState([]);
  const [loadingPartItems, setLoadingPartItems] = useState(false);
  const [selectedPartItemIds, setSelectedPartItemIds] = useState([]);
  const [partItemsTotal, setPartItemsTotal] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchBranchInfo = async () => {
      if (!user?.accountResponse?.id) {
        if (isMounted) {
          setBranchInfo(null);
          setServiceCenterId(null);
          setStaffId("");
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
            setServiceCenterId(null);
            setStaffId("");
          }
          return;
        }

        const staffIdentifier = staff.id || staff.staffId || staff.accountId || "";
        if (isMounted) {
          setStaffId(staffIdentifier);
        }

        let serviceCenter = staff.serviceCenter || null;
        const resolvedServiceCenterId = staff.serviceCenterId || serviceCenter?.id || null;

        if (!serviceCenter && resolvedServiceCenterId) {
          try {
            const centerRes = await getServiceCenterById(resolvedServiceCenterId);
            serviceCenter = centerRes?.data || centerRes;
          } catch (error) {
            console.error("Error fetching service center info:", error);
          }
        }

        if (isMounted) {
          setServiceCenterId(serviceCenter?.id || resolvedServiceCenterId || null);
          const managerName =
            serviceCenter?.managerName ||
            [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim() ||
            staff.managerName ||
            staff.fullName ||
            "—";

          setBranchInfo({
            id: serviceCenter?.code || serviceCenter?.id || resolvedServiceCenterId || "—",
            name: serviceCenter?.name || serviceCenter?.code || staff.serviceCenterName || "Chi nhánh của tôi",
            address: serviceCenter?.address || staff.serviceCenterAddress || "Chưa có địa chỉ",
            manager: managerName,
          });
        }
      } catch (error) {
        console.error("Error fetching branch info:", error);
        if (isMounted) {
          setBranchInfo(null);
          setServiceCenterId(null);
          setStaffId("");
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
    if (staffId) {
      setCreateFormData((prev) => ({
        ...prev,
        importById: staffId,
      }));
    }
  }, [staffId]);

  useEffect(() => {
    if (serviceCenterId) {
      setCreateFormData((prev) => ({
        ...prev,
        serviceCenterId,
      }));
    }
  }, [serviceCenterId]);

  const fetchPartItems = useCallback(async () => {
    try {
      setLoadingPartItems(true);

      const response = await getPartItemsByServiceCenter(serviceCenterId);
      
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

  useEffect(() => {
    if (isCreateDialogOpen && serviceCenterId) {
      fetchPartItems();
    } else {
      setPartItems([]);
      setSelectedPartItemIds([]);
    }
  }, [isCreateDialogOpen, serviceCenterId, fetchPartItems]);

  const selectedPartItemsData = useMemo(() => {
    const selectedItems = partItems.filter(item => selectedPartItemIds.includes(item.id));
    const totalQty = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalAmount = selectedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    return { totalQty, totalAmount, selectedItems };
  }, [partItems, selectedPartItemIds]);

  useEffect(() => {
    setCreateFormData(prev => ({
      ...prev,
      totalQuantity: selectedPartItemsData.totalQty,
      totalAmout: selectedPartItemsData.totalAmount,
      partItemId: selectedPartItemIds,
    }));
  }, [selectedPartItemsData.totalQty, selectedPartItemsData.totalAmount, selectedPartItemIds]);

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

  useEffect(() => {
    window.openEditImportSlip = async (slip) => {
      setSelectedSlip(slip);
      setIsEditDialogOpen(true);
      
      if (slip?.rawData?.id) {
        try {
          setLoadingDetail(true);
          const response = await getImportNoteById(slip.rawData.id);
          if (response.success && response.data) {
            const data = response.data;
            setEditFormData({
              code: data.code || "",
              importDate: data.importDate ? new Date(data.importDate).toISOString().slice(0, 16) : "",
              importFrom: data.importFrom || "",
              supplier: data.supplier || "",
              type: data.type || "SUPPLIER",
              totalAmout: data.totalAmout || 0,
              importById: typeof data.importBy === 'object' ? data.importBy?.id || "" : "",
              serviceCenterId: typeof data.serviceCenter === 'object' ? data.serviceCenter?.id || "" : ""
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
      delete window.openEditImportSlip;
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-rose-100">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Phiếu nhập</h1>
                  <p className="text-sm text-muted-foreground mt-1">Quản lý các phiếu nhập hàng vào kho</p>
                </div>
              </div>
            </div>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/storekeeper/import-slips/create")}
            >
              <Plus className="h-4 w-4" />
              Tạo phiếu nhập mới
            </Button>
          </div>
          
          <div className="p-5 bg-white/95 backdrop-blur rounded-xl border border-rose-200/60 shadow-md">
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
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg text-foreground">{branchInfo.name}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200">
                        Chi nhánh của tôi
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{branchInfo.address}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Quản lý: <span className="font-medium text-foreground">{branchInfo.manager}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Không tìm thấy thông tin chi nhánh. Vui lòng kiểm tra lại tài khoản của bạn.
              </div>
            )}
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại phiếu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="SUPPLIER">Nhà cung cấp</SelectItem>
                <SelectItem value="TRANSFER_IN">Nhận điều chuyển</SelectItem>
              </SelectContent>
            </Select>


            {(typeFilter || statusFilter || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter("");
                  setStatusFilter("");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </div>

        <ImportSlipsTable search={search} typeFilter={typeFilter} statusFilter={statusFilter} />
      </div>

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
            serviceCenterId: ""
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
                  const importDateISO = new Date(editFormData.importDate).toISOString();
                  
                  const updateData = {
                    code: editFormData.code,
                    importDate: importDateISO,
                    importFrom: editFormData.importFrom?.trim() || "Chưa xác định",
                    supplier: editFormData.supplier?.trim() || "Chưa xác định",
                    type: editFormData.type,
                    totalAmout: editFormData.totalAmout
                  };

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

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setCreateFormData({
            importFrom: "",
            supplier: "",
            type: "SUPPLIER",
            totalQuantity: 0,
            totalAmout: 0,
          importById: staffId || "",
          serviceCenterId: serviceCenterId || "",
            partItemId: [],
            note: ""
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
            <div className="space-y-2">
              <Label htmlFor="create-type" className="text-sm font-semibold">Loại phiếu *</Label>
              <Select
                value={createFormData.type}
                onValueChange={(value) => setCreateFormData({ ...createFormData, type: value })}
              >
                <SelectTrigger id="create-type">
                  <SelectValue placeholder="Chọn loại phiếu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER">SUPPLIER - Nhập hàng</SelectItem>
                  <SelectItem value="TRANSFER_IN">TRANSFER_IN - Nhận điều chuyển</SelectItem>
                </SelectContent>
              </Select>
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
                  
                  const selectedItems = partItems.filter(item => selectedPartItemIds.includes(item.id));
                  const calculatedTotalQuantity = selectedItems.reduce((sum, item) => {
                    return sum + (item.quantity || 1);
                  }, 0);
                  const calculatedTotalAmount = selectedItems.reduce((sum, item) => {
                    return sum + ((item.price || 0) * (item.quantity || 1));
                  }, 0);
                  
                  const importFromValue = createFormData.importFrom?.trim() || "Chưa xác định";
                  const supplierValue = createFormData.supplier?.trim() || "Chưa xác định";

                  const createData = {
                    importFrom: importFromValue,
                    supplier: supplierValue,
                    type: createFormData.type,
                    totalQuantity: calculatedTotalQuantity,
                    totalAmout: calculatedTotalAmount,
                    partItemId: selectedPartItemIds,
                    importById: createFormData.importById || staffId || "",
                    serviceCenterId: createFormData.serviceCenterId || serviceCenterId || "",
                  };
                  if (createFormData.note?.trim()) {
                    createData.note = createFormData.note.trim();
                  }

                  const response = await createImportNote(createData);
                  
                  if (response.success) {
                    toast({
                      title: "Thành công",
                      description: "Tạo phiếu nhập mới thành công"
                    });
                    setIsCreateDialogOpen(false);
                    setCreateFormData({
                      importFrom: "",
                      supplier: "",
                      type: "SUPPLIER",
                      totalQuantity: 0,
                      totalAmout: 0,
                      importById: staffId || "",
                      serviceCenterId: serviceCenterId || "",
                      partItemId: [],
                      note: ""
                    });
                    setSelectedPartItemIds([]);
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

