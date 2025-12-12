import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Clock, Users, Hash, Info, Calendar, FileText, Edit, DollarSign, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { getServiceCenterById, createServiceCenterSlot } from "@/api/serviceCentersApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getDashboardOverview } from "@/api/dashboardApi";

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    // Mặc định là thứ 2 của tuần hiện tại
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [slotForm, setSlotForm] = useState({
    date: "",
    slotTime: "",
    capacity: 0,
    isActive: true,
    note: "",
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fetchBranchDetail = async () => {
    if (!id) {
      console.error("BranchDetail: No id provided");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log("BranchDetail: Fetching branch with id:", id);
      const response = await getServiceCenterById(id);
      console.log("BranchDetail: API response:", response);
      
      // Xử lý nhiều cấu trúc response khác nhau
      const branchData = response?.data || response?.data?.data || response;
      
      if (branchData) {
        setBranchDetail(branchData);
        console.log("BranchDetail: Set branch detail:", branchData);
      } else {
        console.error("BranchDetail: No data in response");
      }
    } catch (error) {
      console.error("Error fetching branch detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchDetail();
    const fetchDashboard = async () => {
      if (!id) return;
      try {
        setLoadingDashboard(true);
        const res = await getDashboardOverview(id);
        const data = res?.data?.data || res?.data || res;
        setDashboardData(data || null);
      } catch (error) {
        console.error("Error fetching dashboard overview:", error);
        setDashboardData(null);
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, [id]);

  // Slot time options - SlotTime enum values từ API
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

  // Get day of week from date
  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Sort slots by time (slotTime format: H07_08, H08_09, etc.)
  const sortSlotsByTime = (slots) => {
    if (!slots || !Array.isArray(slots)) return [];
    return [...slots].sort((a, b) => {
      // Extract hour from slotTime (e.g., "H07_08" -> 7)
      const getHour = (slotTime) => {
        if (!slotTime || !slotTime.startsWith("H")) return 0;
        const hourStr = slotTime.replace("H", "").split("_")[0];
        return parseInt(hourStr, 10) || 0;
      };
      return getHour(a.slotTime) - getHour(b.slotTime);
    });
  };

  // Handle create slot
  const handleCreateSlot = async () => {
    if (!slotForm.date || !slotForm.slotTime) {
      toast.error("Lỗi: Vui lòng điền đầy đủ thông tin (Ngày và Khung giờ)", {
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
        dayOfWeek: dayOfWeek,
        slotTime: slotForm.slotTime,
        capacity: Number(slotForm.capacity) || 0,
        isActive: slotForm.isActive,
        note: slotForm.note || "",
      };

      await createServiceCenterSlot(id, slotData);
      
      toast.success("Tạo slot thành công!", {
        position: "top-right",
        autoClose: 4000,
      });

      // Reset form
      setSlotForm({
        date: "",
        slotTime: "",
        capacity: 0,
        isActive: true,
        note: "",
      });
      setIsCreateSlotOpen(false);

      // Refresh branch detail
      await fetchBranchDetail();
    } catch (error) {
      console.error("Error creating slot:", error);
      toast.error(`Lỗi: ${error?.response?.data?.message || error?.message || "Không thể tạo slot. Vui lòng thử lại."}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsCreatingSlot(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-sm">Đang tải chi tiết chi nhánh...</p>
        </div>
      </div>
    );
  }

  if (!branchDetail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy thông tin chi nhánh</p>
          <Button variant="outline" onClick={() => navigate("/admin/branches")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const branchManager = branchDetail.staffs?.find(
    (staff) => staff.position === "MANAGER_BRANCH"
  );

  const summaryStats = {
    totalRevenue: dashboardData?.totalRevenue ?? 0,
    totalAppointments: dashboardData?.totalAppointment ?? 0,
    completedAppointments: dashboardData?.totalAppointment ?? 0,
    totalStaff: branchDetail?.staffs?.length ?? 0,
    activeStaff: branchDetail?.staffs?.filter((s) => s.status === "ACTIVE")?.length ?? 0,
    totalWarrantyClaims: dashboardData?.totalRMA ?? 0,
    confirmedWarranty: dashboardData?.totalRMA ?? 0,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="mb-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/branches")}
            className="mb-3 gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Chi tiết chi nhánh</h1>
              <p className="mt-1 text-sm text-slate-500">
                Thông tin chi tiết về chi nhánh trong hệ thống
              </p>
              <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70" />
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Doanh thu */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="h-1 w-full bg-red-500/80" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-3">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Tổng doanh thu</CardTitle>
                <p className="mt-1 text-xs text-slate-400">Tất cả dịch vụ trong kỳ</p>
              </div>
              <div className="p-2 rounded-full bg-red-50 text-red-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-semibold text-slate-900">
                {formatCurrency(summaryStats.totalRevenue)}
              </div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>+12.5% so với kỳ trước</span>
              </p>
            </CardContent>
          </Card>

          {/* Lịch hẹn */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="h-1 w-full bg-sky-500/80" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-3">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Tổng lịch hẹn</CardTitle>
                <p className="mt-1 text-xs text-slate-400">Bao gồm lịch đã hoàn thành</p>
              </div>
              <div className="p-2 rounded-full bg-sky-50 text-sky-600">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-semibold text-slate-900">
                {summaryStats.totalAppointments}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Hoàn thành:{" "}
                <span className="font-medium text-slate-700">
                  {summaryStats.completedAppointments}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Nhân viên */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="h-1 w-full bg-emerald-500/80" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-3">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Nhân viên</CardTitle>
                <p className="mt-1 text-xs text-slate-400">Đang làm việc / Tổng số</p>
              </div>
              <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-semibold text-slate-900">
                {summaryStats.activeStaff}/{summaryStats.totalStaff}
              </div>
            </CardContent>
          </Card>

          {/* Bảo hành */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="h-1 w-full bg-violet-500/80" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-3">
              <div>
                <CardTitle className="text-sm font-medium text-slate-600">Bảo hành</CardTitle>
                <p className="mt-1 text-xs text-slate-400">Đã xác nhận / Tổng yêu cầu</p>
              </div>
              <div className="p-2 rounded-full bg-violet-50 text-violet-600">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-semibold text-slate-900">
                {summaryStats.confirmedWarranty}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tổng yêu cầu:{" "}
                <span className="font-medium text-slate-700">
                  {summaryStats.totalWarrantyClaims}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cơ bản */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-red-50/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Thông tin cơ bản
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Mã chi nhánh và tên hiển thị trong hệ thống
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    Mã chi nhánh
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {branchDetail.code || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    Tên chi nhánh
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {branchDetail.name || "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mô tả
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  {branchDetail.description || "Không có mô tả"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin liên hệ */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-red-50/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Thông tin liên hệ
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Email, quản lý và địa chỉ chi nhánh
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="mt-1 text-sm text-foreground break-all">
                    {branchDetail.email || "—"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Quản lý
                  </label>
                  {branchManager ? (
                    <>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {branchManager.firstName} {branchManager.lastName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {branchDetail.phone || "Chưa có số điện thoại"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Chưa gán quản lý cho chi nhánh này
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </label>
                  <p className="mt-1 text-sm text-foreground">
                    {branchDetail.address || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bản đồ */}
          {(branchDetail.latitude || branchDetail.longitude || branchDetail.address) && (
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-3 bg-red-50/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Vị trí trên bản đồ
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Hiển thị vị trí chi nhánh trên Google Maps
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md overflow-hidden border border-border">
                  {(() => {
                    const lat = branchDetail.latitude;
                    const lng = branchDetail.longitude;
                    const address = branchDetail.address;
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
              </CardContent>
            </Card>
          )}

          {/* Lịch làm việc */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-red-50/40">
                <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      Lịch làm việc
                      {branchDetail.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0.5 text-[11px] bg-slate-100 text-slate-700">
                          {(() => {
                            // Đếm số slot trong tuần được chọn
                            const weekDays = Array.from({ length: 7 }, (_, i) => {
                              const date = new Date(selectedWeekStart);
                              date.setDate(date.getDate() + i);
                              return format(date, "yyyy-MM-dd");
                            });
                            const slotsInWeek = branchDetail.serviceCenterSlots.filter(slot => 
                              weekDays.includes(slot.date)
                            );
                            return slotsInWeek.length;
                          })()} slot
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Quản lý các khung giờ làm việc của chi nhánh
                    </p>
                  </div>
                </div>
                {/* Date picker để chọn tuần */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedWeekStart && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedWeekStart ? format(selectedWeekStart, "dd/MM/yyyy", { locale: vi }) : "Chọn tuần"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedWeekStart}
                      onSelect={(date) => {
                        if (date) {
                          // Đảm bảo chọn thứ 2 của tuần
                          const day = date.getDay();
                          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                          const monday = new Date(date.setDate(diff));
                          monday.setHours(0, 0, 0, 0);
                          setSelectedWeekStart(monday);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              {branchDetail.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Tạo mảng 7 ngày trong tuần
                    const weekDays = Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(selectedWeekStart);
                      date.setDate(date.getDate() + i);
                      const dayOfWeek = date.getDay();
                      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                      return {
                        date: format(date, "yyyy-MM-dd"),
                        dateObj: new Date(date),
                        dayName: dayNames[dayOfWeek]
                      };
                    });

                    // Group slots theo ngày
                    const groupedByDate = branchDetail.serviceCenterSlots.reduce((acc, slot) => {
                      const date = slot.date;
                      if (!acc[date]) {
                        acc[date] = [];
                      }
                      acc[date].push(slot);
                      return acc;
                    }, {});

                    return weekDays.map((dayInfo) => {
                      const slots = sortSlotsByTime(groupedByDate[dayInfo.date] || []);

                      return (
                        <div key={dayInfo.date} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-foreground">
                                {dayInfo.dayName}, {format(dayInfo.dateObj, "dd/MM/yyyy", { locale: vi })}
                              </h4>
                            </div>
                            {slots.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {slots.length} khung giờ
                              </Badge>
                            )}
                          </div>
                          {slots.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {slots.map((slot) => {
                              const slotLabel =
                                SLOT_TIME_OPTIONS.find((opt) => opt.value === slot.slotTime)?.label ||
                                "-";
                              return (
                                <div
                                  key={slot.id}
                                  className={`p-3 rounded-md border transition-colors ${
                                    slot.isActive
                                      ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                                      : "bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-sm font-medium text-foreground">
                                        {slotLabel}
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
                                </div>
                              );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-slate-400">
                              Không có slot nào trong ngày này
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có slot nào. Nhấn nút "Tạo slot" để thêm khung giờ làm việc.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog tạo slot */}
          <Dialog open={isCreateSlotOpen} onOpenChange={setIsCreateSlotOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tạo slot mới</DialogTitle>
                <DialogDescription>
                  Thêm khung giờ làm việc mới cho chi nhánh này
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
                    onChange={(e) => setSlotForm({ ...slotForm, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="Nhập sức chứa"
                  />
                </div>

                {/* Is Active */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={slotForm.isActive}
                    onCheckedChange={(checked) => setSlotForm({ ...slotForm, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer">
                    Kích hoạt slot
                  </Label>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea
                    id="note"
                    value={slotForm.note}
                    onChange={(e) => setSlotForm({ ...slotForm, note: e.target.value })}
                    placeholder="Nhập ghi chú (tùy chọn)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateSlotOpen(false)} disabled={isCreatingSlot}>
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
    </div>
  );
}

