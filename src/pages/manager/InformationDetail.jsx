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
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast as toastify } from "react-toastify";
import { cn } from "@/lib/utils";

export default function InformationDetail() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceCenter, setServiceCenter] = useState(null);
  const [staff, setStaff] = useState(null);
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: "",
    slotTime: "",
    capacity: 0,
    note: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const accountId = user?.accountResponse?.id;
        if (!accountId) {
          setError("Không tìm thấy thông tin tài khoản");
          return;
        }

        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (!staffData) {
          setError("Không tìm thấy thông tin nhân viên");
          return;
        }

        setStaff(staffData);

        const serviceCenterId = staffData.serviceCenterId;
        if (!serviceCenterId) {
          setError("Không tìm thấy thông tin trung tâm dịch vụ");
          return;
        }

        const centerResponse = await getServiceCenterById(serviceCenterId);
        const centerData = centerResponse?.data || centerResponse;
        setServiceCenter(centerData);
      } catch (err) {
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

  const sortSlotsByTime = (slots) => {
    if (!slots || !Array.isArray(slots)) return [];
    return [...slots].sort((a, b) => {
      const getHour = (slotTime) => {
        if (!slotTime || !slotTime.startsWith("H")) return 0;
        const hourStr = slotTime.replace("H", "").split("_")[0];
        return parseInt(hourStr, 10) || 0;
      };
      return getHour(a.slotTime) - getHour(b.slotTime);
    });
  };

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

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex gap-3 p-3 rounded-lg border border-rose-50 bg-rose-50/50 hover:border-rose-100 transition-colors">
      <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 break-words">{value || "—"}</p>
      </div>
    </div>
  );

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

  const manager = serviceCenter.staffs?.find(s => s.position === "MANAGER_BRANCH");

  const SLOT_TIME_OPTIONS = [
    { value: "H07_08", label: "07:00 - 08:00" },
    { value: "H08_09", label: "08:00 - 09:00" },
    { value: "H09_10", label: "09:00 - 10:00" },
    { value: "H10_11", label: "10:00 - 11:00" },
    { value: "H11_12", label: "11:00 - 12:00" },
    { value: "H13_14", label: "13:00 - 14:00" },
    { value: "H14_15", label: "14:00 - 15:00" },
    { value: "H15_16", label: "15:00 - 16:00" },
    { value: "H16_17", label: "16:00 - 17:00" },
    { value: "H17_18", label: "17:00 - 18:00" },
  ];

  const isPastSlot = (dateStr, slotTime) => {
    if (!dateStr || !slotTime || !slotTime.startsWith("H")) return false;

    const now = new Date();
    const selectedDate = new Date(dateStr);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    if (selected > today) return false;
    if (selected < today) return true;

    const parts = slotTime.replace("H", "").split("_");
    const startHour = parseInt(parts[0], 10);
    if (Number.isNaN(startHour)) return false;

    const slotStart = new Date(selectedDate);
    slotStart.setHours(startHour, 0, 0, 0);

    return slotStart <= now;
  };

  const isSlotExists = (date, slotTime) => {
    if (!date || !slotTime || !serviceCenter?.serviceCenterSlots) return false;
    return serviceCenter.serviceCenterSlots.some(
      (slot) => slot.date === date && slot.slotTime === slotTime
    );
  };

  const getExistingSlotsForDate = (date) => {
    if (!date || !serviceCenter?.serviceCenterSlots) return [];
    return serviceCenter.serviceCenterSlots
      .filter((slot) => slot.date === date)
      .map((slot) => slot.slotTime);
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
  };

  const handleCreateSlot = async () => {
    if (!slotForm.date || !slotForm.slotTime) {
      toastify.error("Vui lòng điền đầy đủ thông tin (Ngày và Khung giờ)", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const capacityValue = Number(slotForm.capacity) || 0;
    if (capacityValue < 1) {
      toastify.error("Sức chứa phải tối thiểu là 1", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    if (isSlotExists(slotForm.date, slotForm.slotTime)) {
      toastify.error(`Slot này đã tồn tại cho ngày ${format(new Date(slotForm.date), "dd/MM/yyyy", { locale: vi })}`, {
        position: "top-right",
        autoClose: 4000,
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
        capacity: Math.max(1, Number(slotForm.capacity) || 1),
        isActive: true,
        note: slotForm.note || "",
      };

      await createServiceCenterSlot(serviceCenter.id, slotData);

      toastify.success("Tạo slot thành công!", {
        position: "top-right",
        autoClose: 4000,
      });

      setSlotForm({
        date: "",
        slotTime: "",
        capacity: 0,
        note: "",
      });
      setIsCreateSlotOpen(false);

      const refreshed = await getServiceCenterById(serviceCenter.id);
      setServiceCenter(refreshed?.data || refreshed);
    } catch (error) {
      toastify.error(error?.response?.data?.message || error?.message || "Không thể tạo slot. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsCreatingSlot(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50/60 p-6 lg:p-8">
      <div className="w-full max-w-[1920px] mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">Thông tin chi tiết</h1>
              <p className="text-muted-foreground text-base mt-2">Thông tin chi tiết về trung tâm dịch vụ</p>
            </div>
          </div>
        </div>
        <div className="space-y-6 w-full">
          <Card className="border border-rose-100 shadow-md bg-white/95">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>Thông tin tổng quan trung tâm dịch vụ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem icon={Building2} label="Tên trung tâm" value={serviceCenter.name} />
                <InfoItem icon={Phone} label="Số điện thoại" value={serviceCenter.phone || "—"} />
                <InfoItem icon={Mail} label="Email" value={serviceCenter.email || "—"} />
                <InfoItem icon={MapPin} label="Địa chỉ" value={serviceCenter.address || "—"} />
              </div>
              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/60 text-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Mô tả</p>
                <p className="text-sm leading-relaxed">{serviceCenter.description || "Không có mô tả"}</p>
              </div>
            </CardContent>
          </Card>

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
                    const slots = sortSlotsByTime(groupedSlots[date]);
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

          <Dialog open={isCreateSlotOpen} onOpenChange={setIsCreateSlotOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tạo slot mới</DialogTitle>
                <DialogDescription>
                  Thêm khung giờ làm việc mới cho trung tâm của bạn.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Ngày *</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                            const dateStr = format(date, "yyyy-MM-dd");
                            const currentSlotTime = slotForm.slotTime;
                            if (currentSlotTime && isSlotExists(dateStr, currentSlotTime)) {
                              setSlotForm({ 
                                ...slotForm, 
                                date: dateStr,
                                slotTime: "" 
                              });
                            } else {
                              setSlotForm({ ...slotForm, date: dateStr });
                            }
                            setIsDatePickerOpen(false);
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slotTime">Khung giờ *</Label>
                  <Select
                    value={slotForm.slotTime}
                    onValueChange={(value) => {
                      if (slotForm.date && isSlotExists(slotForm.date, value)) {
                        toastify.error(`Khung giờ ${SLOT_TIME_OPTIONS.find(opt => opt.value === value)?.label} đã được tạo cho ngày ${format(new Date(slotForm.date), "dd/MM/yyyy", { locale: vi })}`, {
                          position: "top-right",
                          autoClose: 4000,
                        });
                        return;
                      }
                      if (slotForm.date && isPastSlot(slotForm.date, value)) {
                        toastify.error("Không thể chọn khung giờ đã qua thời gian hiện tại.", {
                          position: "top-right",
                          autoClose: 4000,
                        });
                        return;
                      }
                      setSlotForm({ ...slotForm, slotTime: value });
                    }}
                    disabled={!slotForm.date}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={slotForm.date ? "Chọn khung giờ" : "Chọn ngày trước"} />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_TIME_OPTIONS.map((option) => {
                        const exists = slotForm.date ? isSlotExists(slotForm.date, option.value) : false;
                        const past = slotForm.date ? isPastSlot(slotForm.date, option.value) : false;
                        const disabled = exists || past;
                        return (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            disabled={disabled}
                            className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option.label}</span>
                              {exists && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Đã có
                                </Badge>
                              )}
                              {!exists && past && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Quá giờ
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {slotForm.date && (
                    <p className="text-xs text-muted-foreground">
                      {getExistingSlotsForDate(slotForm.date).length > 0 ? (
                        <span>
                          Đã có {getExistingSlotsForDate(slotForm.date).length} slot cho ngày này. 
                          Các slot đã tồn tại hoặc đã qua thời gian hiện tại sẽ bị vô hiệu hóa.
                        </span>
                      ) : (
                        <span>Các khung giờ đã qua thời gian hiện tại sẽ bị vô hiệu hóa, các khung giờ còn lại có thể chọn.</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Sức chứa *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={slotForm.capacity}
                    onFocus={(e) => {
                      if (e.target.value === "0" || e.target.value === "") {
                        setSlotForm({ ...slotForm, capacity: "" });
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      const numValue = parseInt(value, 10);
                      if (value === "" || isNaN(numValue) || numValue < 1) {
                        setSlotForm({
                          ...slotForm,
                          capacity: 1,
                        });
                      } else {
                        setSlotForm({
                          ...slotForm,
                          capacity: numValue,
                        });
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setSlotForm({ ...slotForm, capacity: "" });
                      } else {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue) && numValue >= 1) {
                          setSlotForm({
                            ...slotForm,
                            capacity: numValue,
                          });
                        } else if (value === "0") {
                          setSlotForm({ ...slotForm, capacity: "" });
                        }
                      }
                    }}
                    placeholder="Nhập sức chứa (tối thiểu 1)"
                  />
                </div>
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
      </div>
    </div>
  );
}
