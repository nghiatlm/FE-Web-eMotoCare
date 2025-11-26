import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Hash,
  Building2,
  Bike,
  Wrench,
  DollarSign,
  QrCode,
  MessageSquare,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getAppointmentById, getAppointmentMissingParts } from "@/api/appointmentsApi";

const STATUS_META = {
  PENDING: {
    label: "Chờ xử lý",
    description: "Lịch hẹn đang chờ được xử lý và phê duyệt.",
    pill: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    gradient: "from-yellow-50 via-white to-white",
    icon: Clock,
    panelBorder: "border-yellow-200",
    panelBg: "bg-yellow-50/60",
    panelText: "text-yellow-700",
    panelMuted: "text-yellow-600",
  },
  APPROVED: {
    label: "Đã duyệt",
    description: "Lịch hẹn đã được phê duyệt và sẵn sàng check-in.",
    pill: "bg-green-100 text-green-800 border border-green-200",
    gradient: "from-green-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-green-200",
    panelBg: "bg-green-50/70",
    panelText: "text-green-700",
    panelMuted: "text-green-600",
  },
  CHECKED_IN: {
    label: "Đã check-in",
    description: "Khách hàng đã check-in và đang trong quá trình xử lý.",
    pill: "bg-blue-100 text-blue-800 border border-blue-200",
    gradient: "from-blue-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-blue-200",
    panelBg: "bg-blue-50/70",
    panelText: "text-blue-700",
    panelMuted: "text-blue-600",
  },
  QUOTE_APPROVED: {
    label: "Đã duyệt báo giá",
    description: "Báo giá đã được duyệt và chờ khách hàng xác nhận.",
    pill: "bg-purple-100 text-purple-800 border border-purple-200",
    gradient: "from-purple-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-purple-200",
    panelBg: "bg-purple-50/70",
    panelText: "text-purple-700",
    panelMuted: "text-purple-600",
  },
  REPAIR_COMPLETED: {
    label: "Hoàn thành sửa chữa",
    description: "Quá trình sửa chữa đã hoàn thành, chờ thanh toán.",
    pill: "bg-teal-100 text-teal-800 border border-teal-200",
    gradient: "from-teal-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-teal-200",
    panelBg: "bg-teal-50/70",
    panelText: "text-teal-700",
    panelMuted: "text-teal-600",
  },
  WAITING_FOR_PAYMENT: {
    label: "Chờ thanh toán",
    description: "Lịch hẹn đang chờ khách hàng thanh toán.",
    pill: "bg-orange-100 text-orange-800 border border-orange-200",
    gradient: "from-orange-50 via-white to-white",
    icon: Clock,
    panelBorder: "border-orange-200",
    panelBg: "bg-orange-50/70",
    panelText: "text-orange-700",
    panelMuted: "text-orange-600",
  },
  PAYMENT_FAILED: {
    label: "Thanh toán thất bại",
    description: "Thanh toán không thành công, cần xử lý lại.",
    pill: "bg-red-100 text-red-800 border border-red-200",
    gradient: "from-red-50 via-white to-white",
    icon: XCircle,
    panelBorder: "border-red-200",
    panelBg: "bg-red-50/60",
    panelText: "text-red-700",
    panelMuted: "text-red-600",
  },
  COMPLETED: {
    label: "Hoàn thành",
    description: "Lịch hẹn đã được hoàn thành thành công.",
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    gradient: "from-emerald-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-emerald-200",
    panelBg: "bg-emerald-50/70",
    panelText: "text-emerald-700",
    panelMuted: "text-emerald-600",
  },
  CANCELLED: {
    label: "Đã hủy",
    description: "Lịch hẹn đã bị hủy.",
    pill: "bg-red-100 text-red-800 border border-red-200",
    gradient: "from-red-50 via-white to-white",
    icon: XCircle,
    panelBorder: "border-red-200",
    panelBg: "bg-red-50/60",
    panelText: "text-red-700",
    panelMuted: "text-red-600",
  },
  CANCELED: {
    label: "Đã hủy",
    description: "Lịch hẹn đã bị hủy.",
    pill: "bg-red-100 text-red-800 border border-red-200",
    gradient: "from-red-50 via-white to-white",
    icon: XCircle,
    panelBorder: "border-red-200",
    panelBg: "bg-red-50/60",
    panelText: "text-red-700",
    panelMuted: "text-red-600",
  },
  DEFAULT: {
    label: "Không xác định",
    description: "Trạng thái hiện tại của lịch hẹn chưa xác định.",
    pill: "bg-muted text-muted-foreground border border-muted",
    gradient: "from-muted via-background to-background",
    icon: Clock,
    panelBorder: "border-border/70",
    panelBg: "bg-muted/40",
    panelText: "text-muted-foreground",
    panelMuted: "text-muted-foreground/80",
  },
};

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missingParts, setMissingParts] = useState([]);
  const [loadingMissingParts, setLoadingMissingParts] = useState(false);

  // Format slotTime from "H17_18" to "17:00 - 18:00"
  const formatSlotTime = (slotTime) => {
    if (!slotTime) return "—";
    const match = slotTime.match(/H(\d+)_(\d+)/);
    if (match) {
      const start = match[1];
      const end = match[2];
      return `${start}:00 - ${end}:00`;
    }
    return slotTime;
  };

  // Format appointment type
  const formatAppointmentType = (type) => {
    switch (type) {
      case "WARRANTY_TYPE":
        return "Bảo hành";
      case "MAINTENANCE_TYPE":
        return "Bảo dưỡng";
      case "REPAIR_TYPE":
        return "Sửa chữa";
      default:
        return type || "—";
    }
  };

  // Format duration month (MONTH_12 -> 12 tháng)
  const formatDurationMonth = (durationMonth) => {
    if (!durationMonth) return "—";
    const match = durationMonth.match(/MONTH_(\d+)/);
    if (match) {
      return `${match[1]} tháng`;
    }
    return durationMonth;
  };

  // Format mileage (KM10000 -> 10,000 km)
  const formatMileage = (mileage) => {
    if (!mileage) return "—";
    const match = mileage.match(/KM(\d+)/);
    if (match) {
      const km = parseInt(match[1]);
      return `${km.toLocaleString("vi-VN")} km`;
    }
    return mileage;
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "—";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value);
    } catch (error) {
      return String(value);
    }
  };

  // Format date
  const safeFormat = (value, pattern) => {
    if (!value) return "—";
    try {
      return format(new Date(value), pattern);
    } catch (error) {
      return "—";
    }
  };

  const formatDateTime = (value) => safeFormat(value, "dd/MM/yyyy HH:mm");
  const formatDateOnly = (value) => safeFormat(value, "dd/MM/yyyy");

  // Fetch missing parts
  const fetchMissingParts = useCallback(async (appointmentId) => {
    if (!appointmentId) return;
    try {
      setLoadingMissingParts(true);
      const response = await getAppointmentMissingParts(appointmentId);
      
      console.log("📋 Missing Parts API Response:", response);
      
      // Handle response structure: { data: [...] } or direct array or { data: { rowDatas: [...] } }
      let partsData = [];
      if (Array.isArray(response?.data)) {
        partsData = response.data;
      } else if (Array.isArray(response?.data?.rowDatas)) {
        partsData = response.data.rowDatas;
      } else if (Array.isArray(response?.rowDatas)) {
        partsData = response.rowDatas;
      } else if (Array.isArray(response)) {
        partsData = response;
      }
      
      setMissingParts(partsData);
    } catch (err) {
      console.error("Error fetching missing parts:", err);
      // Không hiển thị error toast vì có thể appointment chưa có missing parts
      setMissingParts([]);
    } finally {
      setLoadingMissingParts(false);
    }
  }, []);

  // Fetch appointment detail
  const fetchAppointmentDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointmentById(id);
      
      console.log("📋 Appointment Detail API Response:", response);
      
      // Handle response structure: { data: { ... } } or direct data
      const appointmentData = response?.data || response;
      setAppointment(appointmentData);
      
      // Gọi API missing parts ngay sau khi fetch appointment detail thành công
      if (appointmentData?.id) {
        fetchMissingParts(appointmentData.id);
      }
    } catch (err) {
      console.error("Error fetching appointment detail:", err);
      setError("Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.");
      toast({
        title: "Lỗi",
        description: err?.message || err?.data?.message || "Không thể tải thông tin lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, fetchMissingParts]);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [fetchAppointmentDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Button variant="ghost" onClick={() => navigate("/manager/appointments")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{error || "Không tìm thấy thông tin lịch hẹn"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = (appointment.status || "PENDING").toUpperCase();
  const statusInfo = STATUS_META[currentStatus] || STATUS_META.DEFAULT;
  const StatusHeroIcon = statusInfo.icon || Clock;

  const customerName = `${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim() || "—";
  const customerPhone = appointment.customer?.phone || "—";
  const customerEmail = appointment.customer?.accountId ? "—" : "—"; // Email not in response
  const customerAddress = appointment.customer?.address || "—";
  const customerCode = appointment.customer?.customerCode || "—";
  const customerCitizenId = appointment.customer?.citizenId || "—";
  const customerGender = appointment.customer?.gender === "MALE" ? "Nam" : appointment.customer?.gender === "FEMALE" ? "Nữ" : "—";
  const customerDateOfBirth = formatDateOnly(appointment.customer?.dateOfBirth);

  const serviceCenterName = appointment.serviceCenter?.name || "—";
  const serviceCenterCode = appointment.serviceCenter?.code || "—";
  const serviceCenterAddress = appointment.serviceCenter?.address || "—";
  const serviceCenterPhone = appointment.serviceCenter?.phone || "—";
  const serviceCenterEmail = appointment.serviceCenter?.email || "—";

  const appointmentDate = formatDateOnly(appointment.appointmentDate);
  const appointmentDateTime = formatDateTime(appointment.appointmentDate);
  const slotTime = formatSlotTime(appointment.slotTime);
  const appointmentType = formatAppointmentType(appointment.type);

  const vehicleInfo = appointment.vehicle
    ? {
        color: appointment.vehicle.color || "—",
        chassisNumber: appointment.vehicle.chassisNumber || "—",
        engineNumber: appointment.vehicle.engineNumber || "—",
        manufactureDate: formatDateOnly(appointment.vehicle.manufactureDate),
        purchaseDate: formatDateOnly(appointment.vehicle.purchaseDate),
        warrantyExpiry: formatDateOnly(appointment.vehicle.warrantyExpiry),
        status: appointment.vehicle.status || "—",
      }
    : null;

  const maintenanceStage = appointment.maintenanceStage
    ? {
        name: appointment.maintenanceStage.name || "—",
        mileage: appointment.maintenanceStage.mileage || null,
        durationMonth: appointment.maintenanceStage.durationMonth || null,
        estimatedTime: appointment.maintenanceStage.estimatedTime || null,
        description: appointment.maintenanceStage.description || null,
      }
    : null;

  const DetailRow = ({ label, value, icon: Icon, className, valueClassName }) => {
    const display = value || value === 0 ? value : "—";
    return (
      <div className={cn("flex items-start gap-2 text-sm", className)}>
        {Icon && <Icon className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-sm font-medium text-foreground", valueClassName)}>{display}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <Button variant="ghost" onClick={() => navigate("/manager/appointments")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        {/* Header Card */}
        <div className={cn("relative mb-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg")}>
          <div className={cn("absolute inset-0 bg-gradient-to-r", statusInfo.gradient)} />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-inner">
                  <StatusHeroIcon className="h-5 w-5 text-primary" />
                </div>
                <span className="uppercase tracking-wide">Lịch hẹn #{appointment.code}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">Chi tiết lịch hẹn</h1>
                <p className="mt-3 text-muted-foreground">{statusInfo.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur", statusInfo.pill)}>
                  <StatusHeroIcon className="h-4 w-4" />
                  {statusInfo.label}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  {appointment.code}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {appointmentDateTime}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {slotTime}
                </span>
              </div>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-foreground shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loại dịch vụ</p>
                <p className="mt-1 text-2xl font-semibold">{appointmentType}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-foreground shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chi phí ước tính</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(appointment.estimatedCost)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Appointment Information */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin lịch hẹn</CardTitle>
                <CardDescription>Tổng quan chi tiết của lịch hẹn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  <div className="border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Thông tin chung
                  </div>
                  <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                    <DetailRow label="Mã lịch hẹn" value={appointment.code} icon={Hash} />
                    <DetailRow label="Loại dịch vụ" value={appointmentType} icon={Wrench} />
                    <DetailRow label="Ngày hẹn" value={appointmentDate} icon={Calendar} />
                    <DetailRow label="Khung giờ" value={slotTime} icon={Clock} />
                    <DetailRow label="Trạng thái" value={statusInfo.label} icon={CheckCircle2} valueClassName="text-primary font-medium" />
                    <DetailRow label="Chi phí ước tính" value={formatCurrency(appointment.estimatedCost)} icon={DollarSign} />
                    <DetailRow label="Chi phí thực tế" value={formatCurrency(appointment.actualCost)} icon={DollarSign} />
                    <DetailRow label="Mã check-in" value={appointment.checkinCode || "—"} icon={QrCode} />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Trung tâm dịch vụ
                  </div>
                  <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
                    <DetailRow label="Tên trung tâm" value={serviceCenterName} />
                    <DetailRow label="Mã trung tâm" value={serviceCenterCode} icon={Hash} />
                    <DetailRow label="Địa chỉ" value={serviceCenterAddress} icon={MapPin} className="md:col-span-2" />
                    <DetailRow label="Số điện thoại" value={serviceCenterPhone} icon={Phone} />
                    <DetailRow label="Email" value={serviceCenterEmail} icon={Mail} />
                  </div>
                </div>

                {vehicleInfo && (
                  <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <Bike className="h-4 w-4" />
                      Thông tin xe
                    </div>
                    <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
                      <DetailRow label="Màu sắc" value={vehicleInfo.color} />
                      <DetailRow label="Số khung" value={vehicleInfo.chassisNumber} />
                      <DetailRow label="Số máy" value={vehicleInfo.engineNumber} />
                      <DetailRow label="Trạng thái" value={vehicleInfo.status} />
                      <DetailRow label="Ngày sản xuất" value={vehicleInfo.manufactureDate} icon={Calendar} />
                      <DetailRow label="Ngày mua" value={vehicleInfo.purchaseDate} icon={Calendar} />
                      <DetailRow label="Hết hạn bảo hành" value={vehicleInfo.warrantyExpiry} icon={Calendar} />
                    </div>
                  </div>
                )}

                {maintenanceStage && (
                  <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <Wrench className="h-4 w-4" />
                      Gói bảo dưỡng
                    </div>
                    <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
                      <DetailRow label="Tên gói" value={maintenanceStage.name || "—"} />
                      <DetailRow label="Số km" value={maintenanceStage.mileage ? formatMileage(maintenanceStage.mileage) : "—"} />
                      <DetailRow label="Thời hạn" value={maintenanceStage.durationMonth ? formatDurationMonth(maintenanceStage.durationMonth) : "—"} />
                      <DetailRow label="Thời gian ước tính" value={maintenanceStage.estimatedTime ? `${maintenanceStage.estimatedTime} phút` : "—"} icon={Clock} />
                      {maintenanceStage.description && (
                        <DetailRow label="Mô tả" value={maintenanceStage.description} className="md:col-span-2" />
                      )}
                    </div>
                  </div>
                )}

                {appointment.note && (
                  <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ghi chú</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{appointment.note}</p>
                  </div>
                )}

                {appointment.checkinQRCode && (
                  <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <QrCode className="h-4 w-4" />
                      QR Code Check-in
                    </div>
                    <div className="px-5 py-5">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center">
                          <img 
                            src={appointment.checkinQRCode} 
                            alt="Check-in QR Code" 
                            className="max-w-xs rounded-lg border border-border shadow-sm" 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Mã check-in: <span className="font-mono font-semibold">{appointment.checkinCode || appointment.code}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Missing Parts */}
                <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Danh sách phụ tùng thiếu
                  </div>
                  <div className="px-5 py-5">
                    {loadingMissingParts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Đang tải danh sách phụ tùng thiếu...</span>
                      </div>
                    ) : missingParts.length > 0 ? (
                      <div className="space-y-4">
                        {missingParts.map((part, index) => (
                          <div key={part.id || index} className="rounded-xl border border-border/60 bg-muted/10 p-4">
                            <div className="grid gap-3 md:grid-cols-2">
                              <DetailRow 
                                label="Mã phụ tùng" 
                                value={part.code || part.partCode || "—"} 
                                icon={Hash}
                              />
                              <DetailRow 
                                label="Tên phụ tùng" 
                                value={part.name || part.partName || "—"} 
                              />
                              <DetailRow 
                                label="Số lượng thiếu" 
                                value={part.quantity || part.missingQuantity || "—"} 
                              />
                              <DetailRow 
                                label="Đơn giá" 
                                value={part.price ? formatCurrency(part.price) : "—"} 
                                icon={DollarSign}
                              />
                              {part.description && (
                                <DetailRow 
                                  label="Mô tả" 
                                  value={part.description} 
                                  className="md:col-span-2"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        Không có phụ tùng thiếu cho lịch hẹn này.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin khách hàng</CardTitle>
                <CardDescription>Chi tiết thông tin khách hàng đặt lịch hẹn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {customerName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "KH"}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{customerName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customerCode && (
                        <Badge className="border border-primary/20 bg-primary/10 text-primary">Mã: {customerCode}</Badge>
                      )}
                      {customerGender && (
                        <Badge variant="outline" className="border-border/70 text-muted-foreground">
                          {customerGender}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Số điện thoại
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{customerPhone}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Ngày sinh
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{customerDateOfBirth}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Địa chỉ
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">{customerAddress}</p>
                  </div>
                  {customerCitizenId && (
                    <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 md:col-span-2">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        CMND/CCCD
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{customerCitizenId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="sticky top-20 self-start space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Tổng quan</CardTitle>
                <CardDescription>Thông tin nhanh về lịch hẹn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                  <div className="mt-2">
                    <Badge className={statusInfo.pill}>{statusInfo.label}</Badge>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày tạo</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(appointment.createdAt)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(appointment.updatedAt)}</p>
                </div>
                {appointment.evCheckId && (
                  <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã kiểm tra</p>
                    <p className="mt-2 text-sm font-medium text-foreground font-mono">{appointment.evCheckId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

