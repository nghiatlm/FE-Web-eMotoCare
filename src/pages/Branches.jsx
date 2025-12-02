import { useEffect, useState } from "react";
import { Search, Plus, Download, Filter, Building2, MapPin, Mail, Phone, Hash, Info, Clock, Calendar, Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import BranchesTable from "@/components/BranchesTable";
import { createServiceCenter, updateServiceCenter, getServiceCenterById } from "@/api/serviceCentersApi";

export default function Branches() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [manager, setManager] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [branchDetail, setBranchDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    email: "",
    location: "",
    phone: "",
    manager: "",
    hours: "",
    status: "active",
    latitude: "",
    longitude: "",
  });

  const resetForm = () => {
    setForm({ code: "", name: "", description: "", email: "", location: "", phone: "", manager: "", hours: "", status: "active", latitude: "", longitude: "" });
  };

  // Fetch branch detail when viewing
  useEffect(() => {
    const fetchBranchDetail = async () => {
      if (selected?.id && isViewOpen) {
        try {
          setLoadingDetail(true);
          const response = await getServiceCenterById(selected.id);
          if (response.success && response.data) {
            setBranchDetail(response.data);
          } else {
            // Fallback to selected data if API fails
            setBranchDetail(selected);
          }
        } catch (error) {
          console.error("Error fetching branch detail:", error);
          // Fallback to selected data
          setBranchDetail(selected);
        } finally {
          setLoadingDetail(false);
        }
      } else if (!isViewOpen) {
        setBranchDetail(null);
      }
    };

    fetchBranchDetail();
  }, [selected, isViewOpen]);

  useEffect(() => {
    // Handlers called from table action buttons
    window.openEditBranch = (row) => {
      setSelected(row);
      setForm({
        code: row.code || "",
        name: row.name || "",
        description: row.description || "",
        email: row.email || "",
        location: row.location || "",
        phone: row.phone || "",
        manager: row.manager || "",
        hours: row.hours || "",
        status: row.status || "active",
        latitude: row.latitude || "",
        longitude: row.longitude || "",
      });
      setIsEditOpen(true);
    };
    window.openViewBranch = (row) => {
      setSelected(row);
      setIsViewOpen(true);
    };
    return () => {
      if (window.openEditBranch) delete window.openEditBranch;
      if (window.openViewBranch) delete window.openViewBranch;
    };
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const tmpId = `BR-${Date.now()}`;
    const statusUpper = String(form.status || "active").toUpperCase();

    // Build API body per backend contract
    const body = {
      code: form.code || `SC-${Date.now()}`,
      name: form.name,
      description: form.description || "",
      email: form.email || "",
      phone: form.phone,
      address: form.location,
      latitude: form.latitude || "",
      longitude: form.longitude || "",
      status: statusUpper,
    };

    try {
      const res = await createServiceCenter(body);
      const created = res?.data || res;
      const mapped = {
        id: created?.id || created?.code || tmpId,
        code: created?.code || form.code,
        name: created?.name || form.name,
        location: created?.address || form.location,
        phone: created?.phone || form.phone,
        email: created?.email || form.email,
        description: created?.description || form.description,
        manager: form.manager,
        hours: form.hours,
        status: String((created?.status || form.status || "active")).toLowerCase(),
        latitude: created?.latitude || form.latitude,
        longitude: created?.longitude || form.longitude,
      };
      window?.applyAddBranch?.(mapped);
    } catch (err) {
      const newBranch = { id: tmpId, ...form };
      window?.applyAddBranch?.(newBranch);
    } finally {
      setIsAddOpen(false);
      resetForm();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selected?.id) return;

    const statusUpper = String(form.status || "active").toUpperCase();
    const body = {
      code: form.code,
      name: form.name,
      description: form.description || "",
      email: form.email || "",
      phone: form.phone,
      address: form.location,
      latitude: form.latitude || "",
      longitude: form.longitude || "",
      status: statusUpper,
    };

    try {
      const res = await updateServiceCenter(selected.id, body);
      const updated = res?.data || res;
      const mapped = {
        code: updated?.code ?? form.code,
        name: updated?.name ?? form.name,
        description: updated?.description ?? form.description,
        email: updated?.email ?? form.email,
        location: updated?.address ?? form.location,
        phone: updated?.phone ?? form.phone,
        manager: form.manager,
        hours: form.hours,
        status: String((updated?.status || form.status || "active")).toLowerCase(),
        latitude: updated?.latitude ?? form.latitude,
        longitude: updated?.longitude ?? form.longitude,
      };
      window?.applyEditBranch?.(selected.id, mapped);
    } catch (err) {
      // Fallback to local update if API fails
      window?.applyEditBranch?.(selected.id, { ...form });
    } finally {
      setIsEditOpen(false);
      setSelected(null);
    }
  };

  return (
  <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý chi nhánh</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi và quản lý hệ thống chi nhánh</p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chi nhánh"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>


            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                <SelectItem value="suspended">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={manager} onValueChange={setManager}>
              <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Quản lý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Dung">Dung</SelectItem>
                <SelectItem value="Thuận">Thuận</SelectItem>
                <SelectItem value="Alex">Alex</SelectItem>
                <SelectItem value="Linh">Linh</SelectItem>
                <SelectItem value="Việt">Việt</SelectItem>
                <SelectItem value="Tâm">Tâm</SelectItem>
                <SelectItem value="Hoàng">Hoàng</SelectItem>
                <SelectItem value="Vương">Vương</SelectItem>
              </SelectContent>
            </Select>

            {(status || manager || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setManager("");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Thêm chi nhánh
              </Button>
            </div>
          </div>
        </div>

        <BranchesTable search={search} status={status} manager={manager} />

        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm chi nhánh</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: GreenWheel" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã chi nhánh (code)</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="VD: SC-HCM-001" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="VD: alo@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về chi nhánh" />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="VD: 123 Đường Lê Lợi" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="VD: 098xxxxxxx" required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giờ hoạt động</Label>
                  <Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder="VD: 08:00 – 17:00 (T2 – T7)" required/>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); }}>Hủy</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Thêm</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa chi nhánh</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên chi nhánh</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã chi nhánh (code)</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giờ hoạt động</Label>
                  <Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Hủy</Button>
                <Button type="submit">Lưu</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={(o) => { 
          setIsViewOpen(o); 
          if (!o) {
            setSelected(null);
            setBranchDetail(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  Chi tiết chi nhánh
                </DialogTitle>
                {branchDetail?.status && (
                  <Badge 
                    variant={branchDetail.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={branchDetail.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }
                  >
                    {branchDetail.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground text-sm">Đang tải chi tiết chi nhánh...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          <span>Mã chi nhánh</span>
                        </div>
                        <p className="text-base font-semibold text-foreground">
                          {branchDetail?.code || selected?.code || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>Tên chi nhánh</span>
                        </div>
                        <p className="text-base font-semibold text-foreground">
                          {branchDetail?.name || selected?.name || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Mô tả</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                        {branchDetail?.description || selected?.description || "Không có mô tả"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Thông tin liên hệ */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Thông tin liên hệ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {branchDetail?.email || selected?.email || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>Số điện thoại</span>
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {branchDetail?.phone || selected?.phone || "—"}
                        </p>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Địa chỉ</span>
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {branchDetail?.address || selected?.location || selected?.address || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bản đồ */}
                {(branchDetail?.latitude || branchDetail?.longitude || selected?.latitude || selected?.longitude || branchDetail?.address || selected?.location || selected?.address) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Vị trí trên bản đồ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md overflow-hidden border border-border">
                        {(() => {
                          const lat = branchDetail?.latitude || selected?.latitude;
                          const lng = branchDetail?.longitude || selected?.longitude;
                          const address = branchDetail?.address || selected?.location || selected?.address;
                          const hasCoords = lat && lng;
                          const q = hasCoords ? `${lat},${lng}` : encodeURIComponent(address || "");
                          const src = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
                          return (
                            <iframe
                              title="branch-map"
                              src={src}
                              style={{ width: "100%", height: 320, border: 0 }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              allowFullScreen
                            />
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Dấu ghim đỏ thể hiện vị trí chi nhánh trên bản đồ.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Lịch làm việc */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Lịch làm việc
                      {branchDetail?.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {branchDetail.serviceCenterSlots.length} slot
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {branchDetail?.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          // Group slots by date
                          const groupedByDate = branchDetail.serviceCenterSlots.reduce((acc, slot) => {
                            const date = slot.date;
                            if (!acc[date]) {
                              acc[date] = [];
                            }
                            acc[date].push(slot);
                            return acc;
                          }, {});

                          // Sort dates
                          const sortedDates = Object.keys(groupedByDate).sort();

                          return sortedDates.map((date) => {
                            const slots = groupedByDate[date];
                            const firstSlot = slots[0];
                            const vietnameseDay = firstSlot.dayOfWeek === 'Saturday' ? 'Thứ Bảy' : 
                                                 firstSlot.dayOfWeek === 'Sunday' ? 'Chủ Nhật' :
                                                 firstSlot.dayOfWeek === 'Monday' ? 'Thứ Hai' :
                                                 firstSlot.dayOfWeek === 'Tuesday' ? 'Thứ Ba' :
                                                 firstSlot.dayOfWeek === 'Wednesday' ? 'Thứ Tư' :
                                                 firstSlot.dayOfWeek === 'Thursday' ? 'Thứ Năm' :
                                                 firstSlot.dayOfWeek === 'Friday' ? 'Thứ Sáu' : firstSlot.dayOfWeek;

                            return (
                              <div key={date} className="border border-border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-foreground">
                                      {vietnameseDay}, {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
                                    </h4>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {slots.length} khung giờ
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                  {slots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className={`p-3 rounded-md border transition-colors ${
                                        slot.isActive
                                          ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800 hover:bg-green-100'
                                          : 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800 hover:bg-gray-100'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-sm font-medium text-foreground">
                                            {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                                          </span>
                                        </div>
                                        {slot.isActive ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>Sức chứa: {slot.capacity}</span>
                                      </div>
                                      {slot.note && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                          {slot.note}
                                        </p>
                                      )}
                                      <div className="mt-2 pt-2 border-t border-border/50">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          slot.isActive 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                                        }`}>
                                          {slot.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Chưa có lịch làm việc nào được thiết lập</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


