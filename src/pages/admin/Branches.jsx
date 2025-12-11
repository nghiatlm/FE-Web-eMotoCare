import { useEffect, useState, useRef } from "react";
import { Search, Plus, Download, Filter, Building2, MapPin, Mail, Phone, Hash, Info, Clock, Calendar, Users, CheckCircle, XCircle, Pencil } from "lucide-react";
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [branchDetail, setBranchDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const DEFAULT_COORDS = { lat: 10.762622, lng: 106.660172 }; // TP.HCM center fallback
  const formRef = useRef(null);
  const geoTimeoutRef = useRef(null);

  const [form, setForm] = useState({
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
    setForm({ name: "", description: "", email: "", location: "", phone: "", manager: "", hours: "", status: "active", latitude: "", longitude: "" });
  };

  useEffect(() => {
    const fetchBranchDetail = async () => {
      if (selected?.id && isViewOpen) {
        try {
          setLoadingDetail(true);
          const response = await getServiceCenterById(selected.id);
          if (response.success && response.data) {
            setBranchDetail(response.data);
          } else {
            setBranchDetail(selected);
          }
        } catch (error) {
          console.error("Error fetching branch detail:", error);
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

  useEffect(() => {
    if (isAddOpen && !selected) {
      resetForm();
    }
  }, [isAddOpen]);

  // Geocode địa chỉ để tự động lấy lat/lng cho form add & edit
  const geocodeAddress = async (address) => {
    if (!address || address.trim().length < 3) {
      return { lat: null, lng: null };
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&countrycodes=vn&limit=1&addressdetails=1`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }

    return { lat: null, lng: null };
  };

  // Tự động geocode khi địa chỉ thay đổi (add hoặc edit)
  useEffect(() => {
    if (!(isAddOpen || isEditOpen)) return;

    if (geoTimeoutRef.current) {
      clearTimeout(geoTimeoutRef.current);
    }

    const shouldGeocode = form.location && form.location.trim().length >= 3 && (!form.latitude || !form.longitude);
    if (!shouldGeocode) {
      return;
    }

    geoTimeoutRef.current = setTimeout(async () => {
      setGeocodeLoading(true);
      const coords = await geocodeAddress(form.location);
      if (coords.lat && coords.lng) {
        setForm((f) => ({
          ...f,
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
        }));
      }
      setGeocodeLoading(false);
    }, 400);

    return () => {
      if (geoTimeoutRef.current) clearTimeout(geoTimeoutRef.current);
    };
  }, [form.location, isAddOpen, isEditOpen]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const tmpId = `BR-${Date.now()}`;
    const body = {
      name: form.name,
      description: form.description || "",
      email: form.email || "",
      phone: form.phone,
      address: form.location,
      latitude: form.latitude || "",
      longitude: form.longitude || "",
      status: "ACTIVE",
    };

    try {
      const res = await createServiceCenter(body);
      const created = res?.data?.data || res?.data || res;
      const mapped = {
        id: created?.id || created?.code || tmpId,
        code: created?.code || created?.id || "",
        name: created?.name || form.name,
        location: created?.address || form.location,
        phone: created?.phone || form.phone,
        email: created?.email || form.email,
        description: created?.description || form.description,
        manager: form.manager,
        hours: form.hours,
        status: String((created?.status || "ACTIVE")).toLowerCase(),
        latitude: created?.latitude || form.latitude,
        longitude: created?.longitude || form.longitude,
      };
      window?.applyAddBranch?.(mapped);
    } catch (err) {
      const newBranch = { id: tmpId, code: "", ...form, status: "active" };
      window?.applyAddBranch?.(newBranch);
    } finally {
      setIsAddOpen(false);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window?.applyEditBranch?.(selected.id, { ...form });
    } finally {
      setIsEditOpen(false);
      setSelected(null);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quản lý chi nhánh</h1>
          <p className="mt-2 text-base md:text-lg font-medium text-slate-700">Theo dõi và quản lý hệ thống chi nhánh</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px] md:min-w-[320px] md:max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chi nhánh"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>


            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="in_active">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            {(status || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm" onClick={() => {
                resetForm();
                setSelected(null);
                setIsAddOpen(true);
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}>
                <Plus className="h-4 w-4" />
                Thêm chi nhánh
              </Button>
            </div>
          </div>
        </div>

        <BranchesTable search={search} status={status} />

        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) { resetForm(); setSelected(null); } }}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Plus className="h-5 w-5 text-red-600" />
                Thêm chi nhánh mới
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: GreenWheel" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="VD: alo@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="VD: 098xxxxxxx" required/>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về chi nhánh" />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="VD: 123 Đường Lê Lợi" required/>
                <div className="mt-2 rounded-md border border-slate-200 bg-white overflow-hidden">
                  <div className="p-2 text-xs text-muted-foreground">
                    Bản đồ xem trước (tự lấy tọa độ khi nhập địa chỉ)
                  </div>
                  <iframe
                    title="branch-map-add"
                    src={`https://www.google.com/maps?q=${form.latitude || DEFAULT_COORDS.lat},${form.longitude || DEFAULT_COORDS.lng}&z=16&output=embed`}
                    style={{ width: "100%", height: 240, border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                    setSelected(null);
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chi nhánh
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setSelected(null); }}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Pencil className="h-5 w-5 text-red-600" />
                Chỉnh sửa chi nhánh
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required/>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required/>
                <div className="mt-2 rounded-md border border-slate-200 bg-white overflow-hidden">
                  <div className="p-2 text-xs text-muted-foreground">
                    Bản đồ xem trước (tự lấy tọa độ khi nhập địa chỉ)
                  </div>
                  <iframe
                    title="branch-map-edit"
                    src={`https://www.google.com/maps?q=${form.latitude || DEFAULT_COORDS.lat},${form.longitude || DEFAULT_COORDS.lng}&z=16&output=embed`}
                    style={{ width: "100%", height: 220, border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Hủy</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Lưu</Button>
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
                          const groupedByDate = branchDetail.serviceCenterSlots.reduce((acc, slot) => {
                            const date = slot.date;
                            if (!acc[date]) {
                              acc[date] = [];
                            }
                            acc[date].push(slot);
                            return acc;
                          }, {});

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


