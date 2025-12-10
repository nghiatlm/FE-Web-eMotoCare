import { useEffect, useState } from "react";
import { Building2, MapPin, Phone, Mail, Clock, Users, Wrench, Calendar, ChevronRight, Plus, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarRange } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getServiceCenterById, createServiceCenterSlot } from "@/api/serviceCentersApi";
import { format, startOfWeek, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function InformationDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceCenter, setServiceCenter] = useState(null);
  const [staff, setStaff] = useState(null);
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [slotForm, setSlotForm] = useState({
    date: "",
    slotTime: "",
    capacity: 0,
    isActive: true,
    note: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy accountId từ user
        const accountId = user?.accountResponse?.id;
        if (!accountId) {
          setError("Không tìm thấy thông tin tài khoản");
          return;
        }

        // Gọi API staffs với accountId
        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (!staffData) {
          setError("Không tìm thấy thông tin nhân viên");
          return;
        }

        setStaff(staffData);

        // Lấy serviceCenterId từ staff
        const serviceCenterId = staffData.serviceCenterId;
        if (!serviceCenterId) {
          setError("Không tìm thấy thông tin trung tâm dịch vụ");
          return;
        }

        // Gọi API service center
        const centerResponse = await getServiceCenterById(serviceCenterId);
        const centerData = centerResponse?.data || centerResponse;
        setServiceCenter(centerData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải thông tin. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const formatSlotTime = (slotTime) => {
    if (!slotTime || !slotTime.startsWith("H")) return slotTime;
    const parts = slotTime.replace("H", "").split("_");
    if (parts.length === 2) {
      return `${parts[0]}:00 - ${parts[1]}:00`;
    }
    return slotTime;
  };

  const groupSlotsByDate = (slots) => {
    if (!slots || !Array.isArray(slots)) return {};
    return slots.reduce((acc, slot) => {
      const date = slot.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});
  };

  // Get Vietnamese day name
  const getVietnameseDay = (dayOfWeek) => {
    const days = {
      Monday: "Thứ Hai",
      Tuesday: "Thứ Ba",
      Wednesday: "Thứ Tư",
      Thursday: "Thứ Năm",
      Friday: "Thứ Sáu",
      Saturday: "Thứ Bảy",
      Sunday: "Chủ Nhật",
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!serviceCenter) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Không có dữ liệu</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(serviceCenter.serviceCenterSlots || []);
  const sortedDates = Object.keys(groupedSlots).sort();
  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const sortedDatesInWeek = sortedDates.filter((date) => {
    const d = new Date(date);
    return d >= weekStart && d <= weekEnd;
  });

  // Tìm manager từ danh sách staffs
  const manager = serviceCenter.staffs?.find(s => s.position === "MANAGER_BRANCH");

  // --- Tạo slot (cho Manager) ---
  const SLOT_TIME_OPTIONS = [
    { value: "H07_08", label: "07:00 - 08:00" },
    { value: "H08_09", label: "08:00 - 09:00" },
    { value: "H09_10", label: "09:00 - 10:00" },
    { value: "H10_11", label: "10:00 - 11:00" },
    { value: "H13_14", label: "13:00 - 14:00" },
    { value: "H14_15", label: "14:00 - 15:00" },
    { value: "H15_16", label: "15:00 - 16:00" },
    { value: "H16_17", label: "16:00 - 17:00" },
    { value: "H17_18", label: "17:00 - 18:00" },
  ];

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
  };

  const handleCreateSlot = async () => {
    if (!slotForm.date || !slotForm.slotTime) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin (Ngày và Khung giờ)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingSlot(true);
      const dayOfWeek = getDayOfWeek(slotForm.date);

      const slotData = {
        date: slotForm.date,
        dayOfWeek,
        slotTime: slotForm.slotTime,
        capacity: Number(slotForm.capacity) || 0,
        isActive: slotForm.isActive,
        note: slotForm.note || "",
      };

      await createServiceCenterSlot(serviceCenter.id, slotData);

      toast({
        title: "Thành công",
        description: "Tạo slot thành công!",
      });

      setSlotForm({
        date: "",
        slotTime: "",
        capacity: 0,
        isActive: true,
        note: "",
      });
      setIsCreateSlotOpen(false);

      // Refresh service center detail
      const refreshed = await getServiceCenterById(serviceCenter.id);
      setServiceCenter(refreshed?.data || refreshed);
    } catch (error) {
      console.error("Error creating slot:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || error?.message || "Không thể tạo slot. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSlot(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Thông tin Chi tiết Trung tâm</h1>
          <p className="text-muted-foreground">Thông tin chi tiết về trung tâm dịch vụ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên trung tâm</label>
                <p className="text-lg font-semibold text-foreground mt-1">{serviceCenter.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </label>
                  <p className="text-foreground mt-1">{serviceCenter.address || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{serviceCenter.phone || "—"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-foreground mt-1">{serviceCenter.email || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                <p className="text-foreground mt-1">{serviceCenter.description || "Không có mô tả"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bản đồ */}
          {(serviceCenter.latitude || serviceCenter.longitude || serviceCenter.address) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Vị trí trên bản đồ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md overflow-hidden border border-border">
                  {(() => {
                    const lat = serviceCenter.latitude;
                    const lng = serviceCenter.longitude;
                    const address = serviceCenter.address;
                    const hasCoords = lat && lng;
                    const q = hasCoords ? `${lat},${lng}` : encodeURIComponent(address || "");
                    const src = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
                    return (
                      <iframe
                        title="service-center-map"
                        src={src}
                        style={{ width: "100%", height: 400, border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Dấu ghim đỏ thể hiện vị trí trung tâm dịch vụ trên bản đồ.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Lịch làm việc
                  {serviceCenter.serviceCenterSlots && serviceCenter.serviceCenterSlots.length > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0.5 text-[11px] bg-slate-100 text-slate-700">
                      {serviceCenter.serviceCenterSlots.length} slot
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Quản lý các khung giờ làm việc tại trung tâm của bạn.</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekAnchor(addDays(weekStart, -7))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 gap-2">
                        <CalendarRange className="h-4 w-4" />
                        {`${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM/yyyy")}`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto" align="end">
                      <CalendarComponent
                        mode="single"
                        selected={weekAnchor}
                        onSelect={(date) => date && setWeekAnchor(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekAnchor(addDays(weekStart, 7))}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => setWeekAnchor(new Date())}>
                    Tuần này
                  </Button>
                </div>
                <Button onClick={() => setIsCreateSlotOpen(true)} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Tạo slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedDatesInWeek.length > 0 ? (
                <div className="space-y-4">
                  {sortedDatesInWeek.map((date) => {
                    const slots = groupedSlots[date];
                    const firstSlot = slots[0];
                    const vietnameseDay = getVietnameseDay(firstSlot.dayOfWeek);

                    return (
                      <div
                        key={date}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {vietnameseDay}, {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
                              </h4>
                              <p className="text-xs text-muted-foreground">Ngày làm việc</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
                            {slots.length} khung giờ
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className={`p-4 rounded-lg border transition-all shadow-[0_4px_12px_-8px_rgba(0,0,0,0.15)] ${
                                slot.isActive
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                  {formatSlotTime(slot.slotTime)}
                                </span>
                                <Badge
                                  variant={slot.isActive ? "default" : "secondary"}
                                  className={`text-xs px-2 ${
                                    slot.isActive
                                      ? "bg-emerald-600 hover:bg-emerald-700"
                                      : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                                  }`}
                                >
                                  {slot.isActive ? "Hoạt động" : "Tạm dừng"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Sức chứa: {slot.capacity}
                              </div>
                              {slot.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {slot.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Không có slot trong tuần này</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog tạo slot cho Manager */}
          <Dialog open={isCreateSlotOpen} onOpenChange={setIsCreateSlotOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tạo slot mới</DialogTitle>
                <DialogDescription>
                  Thêm khung giờ làm việc mới cho trung tâm của bạn.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Ngày *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !slotForm.date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {slotForm.date ? format(new Date(slotForm.date), "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={slotForm.date ? new Date(slotForm.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setSlotForm({ ...slotForm, date: format(date, "yyyy-MM-dd") });
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Slot Time */}
                <div className="space-y-2">
                  <Label htmlFor="slotTime">Khung giờ *</Label>
                  <Select
                    value={slotForm.slotTime}
                    onValueChange={(value) => setSlotForm({ ...slotForm, slotTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khung giờ" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label htmlFor="capacity">Sức chứa</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={slotForm.capacity}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, capacity: parseInt(e.target.value, 10) || 0 })
                    }
                    placeholder="Nhập sức chứa"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={slotForm.isActive}
                    onCheckedChange={(checked) =>
                      setSlotForm({ ...slotForm, isActive: Boolean(checked) })
                    }
                  />
                  <Label htmlFor="isActive">Kích hoạt slot ngay sau khi tạo</Label>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    value={slotForm.note}
                    onChange={(e) => setSlotForm({ ...slotForm, note: e.target.value })}
                    placeholder="Ví dụ: Slot ưu tiên cho lịch bảo dưỡng định kỳ..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateSlotOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateSlot} disabled={isCreatingSlot}>
                  {isCreatingSlot ? "Đang tạo..." : "Tạo slot"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6 sticky top-9 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-lg px-4 py-2 ${
                  serviceCenter.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400"
                }`}
              >
                {serviceCenter.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
              </Badge>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã trung tâm</span>
                  <span className="text-foreground font-medium">{serviceCenter.code || serviceCenter.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {manager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Quản lý
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên quản lý</label>
                  <p className="text-foreground font-semibold mt-1">
                    {manager.firstName} {manager.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mã nhân viên</label>
                  <p className="text-foreground mt-1">{manager.staffCode || "—"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tổng nhân viên</span>
                <span className="text-2xl font-bold text-foreground">
                  {serviceCenter.staffs?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số slot lịch</span>
                <span className="text-2xl font-bold text-primary">
                  {serviceCenter.serviceCenterSlots?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Slot đang hoạt động</span>
                <span className="text-2xl font-bold text-green-600">
                  {serviceCenter.serviceCenterSlots?.filter(s => s.isActive).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
