import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Hash,
  Wrench,
  DollarSign,
  QrCode,
  MessageSquare,
  Package,
  Loader2,
  Tag,
  Gauge, 
  Clock3,
  Bike,
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
    pill: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    gradient: "from-yellow-50 via-white to-white",
    icon: Clock,
  },
  APPROVED: {
    label: "Đã duyệt",
    description: "Lịch hẹn đã được phê duyệt và sẵn sàng check-in.",
    pill: "bg-green-50 text-green-700 border border-green-200",
    gradient: "from-green-50 via-white to-white",
    icon: CheckCircle2,
  },
  CHECKED_IN: {
    label: "Đã check-in",
    description: "Khách hàng đã check-in và đang trong quá trình xử lý.",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
    gradient: "from-blue-50 via-white to-white",
    icon: CheckCircle2,
  },
  QUOTE_APPROVED: {
    label: "Đã duyệt báo giá",
    description: "Báo giá đã được duyệt và chờ khách hàng xác nhận.",
    pill: "bg-purple-50 text-purple-700 border border-purple-200",
    gradient: "from-purple-50 via-white to-white",
    icon: CheckCircle2,
  },
  REPAIR_COMPLETED: {
    label: "Hoàn thành sửa chữa",
    description: "Quá trình sửa chữa đã hoàn thành, chờ thanh toán.",
    pill: "bg-teal-50 text-teal-700 border border-teal-200",
    gradient: "from-teal-50 via-white to-white",
    icon: CheckCircle2,
  },
  WAITING_FOR_PAYMENT: {
    label: "Chờ thanh toán",
    description: "Lịch hẹn đang chờ khách hàng thanh toán.",
    pill: "bg-orange-50 text-orange-700 border border-orange-200",
    gradient: "from-orange-50 via-white to-white",
    icon: Clock,
  },
  PAYMENT_FAILED: {
    label: "Thanh toán thất bại",
    description: "Thanh toán không thành công, cần xử lý lại.",
    pill: "bg-red-50 text-red-700 border border-red-200",
    gradient: "from-red-50 via-white to-white",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Hoàn thành",
    description: "Lịch hẹn đã được hoàn thành thành công.",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    gradient: "from-emerald-50 via-white to-white",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Đã hủy",
    description: "Lịch hẹn đã bị hủy.",
    pill: "bg-gray-100 text-gray-700 border border-gray-200",
    gradient: "from-gray-50 via-white to-white",
    icon: XCircle,
  },
  CANCELED: {
    label: "Đã hủy",
    description: "Lịch hẹn đã bị hủy.",
    pill: "bg-gray-100 text-gray-700 border border-gray-200",
    gradient: "from-gray-50 via-white to-white",
    icon: XCircle,
  },
  DEFAULT: {
    label: "Không xác định",
    description: "Trạng thái hiện tại của lịch hẹn chưa xác định.",
    pill: "bg-muted text-muted-foreground border border-muted",
    gradient: "from-muted via-background to-background",
    icon: Clock,
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

  const formatAppointmentType = (type) => {
    switch (type) {
      case "WARRANTY_TYPE":
        return "Bảo hành";
      case "MAINTENANCE_TYPE":
        return "Bảo dưỡng";
      case "REPAIR_TYPE":
        return "Sửa chữa";
      case "CAMPAIGN_TYPE":
        return "Chiến dịch";
      case "RECALL_TYPE":
        return "Triệu hồi";
      default:
        return type || "—";
    }
  };

  const formatDurationMonth = (durationMonth) => {
    if (!durationMonth) return "—";
    const match = durationMonth.match(/MONTH_(\d+)/);
    if (match) {
      return `${match[1]} tháng`;
    }
    return durationMonth;
  };

  const formatMileage = (mileage) => {
    if (!mileage) return "—";
    const match = mileage.match(/KM(\d+)/);
    if (match) {
      const km = parseInt(match[1]);
      return `${km.toLocaleString("vi-VN")} km`;
    }
    return mileage;
  };

  const formatColor = (color) => {
    if (!color) return "—";
    const normalized = String(color).trim().toLowerCase();

    const map = {
      black: "Đen",
      white: "Trắng",
      silver: "Bạc",
      gray: "Xám",
      grey: "Xám",
      blue: "Xanh dương",
      red: "Đỏ",
      green: "Xanh lá",
      yellow: "Vàng",
      orange: "Cam",
      brown: "Nâu",
      purple: "Tím",
      pink: "Hồng",
    };

    return map[normalized] || color;
  };

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

  const fetchMissingParts = useCallback(async (appointmentId) => {
    if (!appointmentId) return;
    try {
      setLoadingMissingParts(true);
      const response = await getAppointmentMissingParts(appointmentId);
      
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
      setMissingParts([]);
    } finally {
      setLoadingMissingParts(false);
    }
  }, []);

  const fetchAppointmentDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointmentById(id);
      
      const appointmentData = response?.data || response;
      setAppointment(appointmentData);
      
      if (appointmentData?.id) {
        fetchMissingParts(appointmentData.id);
      }
    } catch (err) {
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
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
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

  const STATUS_FLOW = [
    "PENDING",
    "APPROVED",
    "CHECKED_IN",
    "QUOTE_APPROVED",
    "REPAIR_COMPLETED",
    "WAITING_FOR_PAYMENT",
    "COMPLETED",
  ];

  const isCanceled =
    currentStatus === "CANCELLED" || currentStatus === "CANCELED";
  const isPaymentFailed = currentStatus === "PAYMENT_FAILED";
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  let timelineSteps = STATUS_FLOW.map((status, idx) => {
    const meta = STATUS_META[status] || {};
    const completed =
      !isCanceled && !isPaymentFailed && currentIdx > idx && currentIdx !== -1;
    const active =
      !isCanceled && !isPaymentFailed && currentIdx === idx && currentIdx !== -1;
    return {
      key: status,
      label: meta.label || status,
      description: meta.description || "",
      completed,
      active,
    };
  });

  if (isPaymentFailed) {
    timelineSteps.push({
      key: "PAYMENT_FAILED",
      label: STATUS_META.PAYMENT_FAILED.label,
      description: STATUS_META.PAYMENT_FAILED.description,
      completed: false,
      active: true,
    });
  }

  if (isCanceled) {
    timelineSteps = timelineSteps.map((step) => ({
      ...step,
      completed: false,
      active: false,
    }));
    timelineSteps.push({
      key: "CANCELLED",
      label: STATUS_META.CANCELLED.label,
      description: STATUS_META.CANCELLED.description,
      completed: false,
      active: true,
    });
  }

  const customerName = `${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim() || "—";
  const customerPhone = appointment.customer?.account?.phone || "—";
  const customerAddress = appointment.customer?.address || "—";
  const customerCode = appointment.customer?.customerCode || "—";
  
  const appointmentDate = formatDateOnly(appointment.appointmentDate);
  const slotTime = formatSlotTime(appointment.slotTime);
  const appointmentType = formatAppointmentType(appointment.type);

  const vehicleInfo = appointment.vehicle ? {
      color: formatColor(appointment.vehicle.color),
      chassisNumber: appointment.vehicle.chassisNumber || "—",
      engineNumber: appointment.vehicle.engineNumber || "—",
      manufactureDate: formatDateOnly(appointment.vehicle.manufactureDate),
      purchaseDate: formatDateOnly(appointment.vehicle.purchaseDate),
      warrantyExpiry: formatDateOnly(appointment.vehicle.warrantyExpiry),
      status: appointment.vehicle.status || "—",
    } : null;

  const maintenanceStage = appointment.maintenanceStage ? {
      name: appointment.maintenanceStage.name || "—",
      mileage: appointment.maintenanceStage.mileage || null,
      durationMonth: appointment.maintenanceStage.durationMonth || null,
      estimatedTime: appointment.maintenanceStage.estimatedTime || null,
      description: appointment.maintenanceStage.description || null,
    } : null;

  const DetailRow = ({ label, value, icon: Icon, className, valueClassName }) => {
    const display = value || value === 0 ? value : "—";
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        <div className="flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
          {Icon && <Icon className="h-3 w-3 mr-1 text-muted-foreground" />}
          {label}
        </div>
        <p className={cn("text-sm font-semibold text-foreground", valueClassName)}>
          {display}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 py-8 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
        <Button variant="ghost" onClick={() => navigate("/manager/appointments")} className="mb-8 text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>

        <div className="mb-10 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <StatusHeroIcon className={cn("h-6 w-6", statusInfo.pill.includes("text-") ? statusInfo.pill.split(" ").find(c => c.startsWith("text-")) : "text-primary")} />
                <h1 className="text-3xl font-bold text-slate-900">
                  Lịch hẹn #{appointment.code}
                </h1>
                <Badge className={cn("ml-2 text-sm", statusInfo.pill)}>
                    {statusInfo.label}
                </Badge>
              </div>
              <p className="mt-2 text-slate-600 text-base">{statusInfo.description}</p>
            </div>
            
            <div className="w-full md:w-auto flex-shrink-0">
              <div className="relative rounded-2xl border border-red-200 bg-gradient-to-b from-rose-50 via-white to-rose-100 px-6 py-4 text-center shadow-[0_10px_30px_rgba(248,113,113,0.2)]">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
                  <Wrench className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">
                  Loại dịch vụ
                </p>
                <p className="mt-1 text-xl font-extrabold text-red-700 tracking-tight">
                  {appointmentType}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DetailRow label="Mã lịch hẹn" value={appointment.code} icon={Hash} />
            <DetailRow label="Ngày hẹn" value={appointmentDate} icon={Calendar} />
            <DetailRow label="Khung giờ" value={slotTime} icon={Clock} />
            <DetailRow label="Mã check-in" value={appointment.checkinCode || "—"} icon={QrCode} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            
            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-slate-800">Thông tin khách hàng</CardTitle>
                <CardDescription>Chi tiết thông tin khách hàng đặt lịch hẹn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-700 shadow-inner">
                    {customerName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "KH"}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{customerName}</p>
                    {customerCode && (
                      <Badge variant="outline" className="mt-1 bg-rose-50 text-rose-600 border-rose-200 font-normal">
                        Mã KH: {customerCode}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailRow label="Số điện thoại" value={customerPhone} icon={Phone} valueClassName="break-all" />
                  <DetailRow label="Địa chỉ" value={customerAddress} icon={MapPin} className="md:col-span-2 lg:col-span-1" valueClassName="leading-relaxed" />
                </div>
              </CardContent>
            </Card>

            {vehicleInfo && (
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Bike className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl font-semibold text-slate-800">Thông tin xe</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3 pt-0">
                    <DetailRow label="Màu sắc" value={vehicleInfo.color} />
                    <DetailRow label="Số khung" value={vehicleInfo.chassisNumber} />
                    <DetailRow label="Số máy" value={vehicleInfo.engineNumber} />
                    <DetailRow label="Ngày sản xuất" value={vehicleInfo.manufactureDate} icon={Calendar} />
                    <DetailRow label="Ngày mua" value={vehicleInfo.purchaseDate} icon={Calendar} />
                    <DetailRow label="Hết hạn BH" value={vehicleInfo.warrantyExpiry} icon={Calendar} />
                </CardContent>
              </Card>
            )}

            {maintenanceStage && (
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl font-semibold text-slate-800">Gói bảo dưỡng</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4 pt-0">
                    <DetailRow label="Tên gói" value={maintenanceStage.name || "—"} className="md:col-span-2" />
                    <DetailRow label="Số km" value={maintenanceStage.mileage ? formatMileage(maintenanceStage.mileage) : "—"} icon={Gauge} />
                    <DetailRow label="Thời hạn" value={maintenanceStage.durationMonth ? formatDurationMonth(maintenanceStage.durationMonth) : "—"} icon={Clock} />
                    <DetailRow label="Thời gian ước tính" value={maintenanceStage.estimatedTime ? `${maintenanceStage.estimatedTime} phút` : "—"} icon={Clock3} />
                    {maintenanceStage.description && (
                      <DetailRow label="Mô tả" value={maintenanceStage.description} className="md:col-span-4" valueClassName="text-slate-600" />
                    )}
                </CardContent>
              </Card>
            )}
            {appointment.note && (
                <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/70 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Ghi chú từ khách hàng</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{appointment.note}</p>
                </div>
            )}

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-semibold text-slate-800">Danh sách phụ tùng thiếu</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loadingMissingParts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-3 text-sm text-muted-foreground">Đang tải danh sách phụ tùng thiếu...</span>
                  </div>
                ) : missingParts.length > 0 ? (
                  <div className="space-y-4">
                    {missingParts.map((part, index) => (
                      <div key={part.id || index} className="rounded-lg border border-red-100 bg-red-50 p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-4">
                          <DetailRow label="Mã PT" value={part.code || part.partCode || "—"} icon={Tag} />
                          <DetailRow label="Số lượng thiếu" value={part.quantity || part.missingQuantity || "—"} valueClassName="font-bold text-red-700" />
                          <DetailRow label="Đơn giá" value={part.price ? formatCurrency(part.price) : "—"} icon={DollarSign} />
                          <DetailRow label="Tên phụ tùng" value={part.name || part.partName || "—"} className="md:col-span-4 lg:col-span-1" />
                          {part.description && (
                            <DetailRow label="Mô tả" value={part.description} className="md:col-span-4" valueClassName="text-slate-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                    Không có phụ tùng thiếu cho lịch hẹn này.
                  </div>
                )}
              </CardContent>
            </Card>

          
          </div>

          <div className="space-y-6 lg:col-span-1">
            <Card className="sticky top-8 shadow-md border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-slate-800">Tổng quan</CardTitle>
                <CardDescription>Các mốc thời gian quan trọng của lịch hẹn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Trạng thái hiện tại</p>
                  <div className="mt-2">
                    <Badge
                      className={cn(
                        "text-base px-3 py-1.5 cursor-default",
                        statusInfo.pill
                      )}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <DetailRow label="Ngày tạo" value={formatDateTime(appointment.createdAt)} icon={Calendar} className="border-b border-dashed pb-4" />
                <DetailRow label="Cập nhật lần cuối" value={formatDateTime(appointment.updatedAt)} icon={Clock} />

                <div className="pt-2">
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Dòng trạng thái</p>
                  <div className="space-y-4">
                    {timelineSteps.map((step, idx) => (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full border",
                              step.completed
                                ? "bg-emerald-500 border-emerald-500"
                                : step.active
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-white border-slate-300"
                            )}
                          />
                          {idx < timelineSteps.length - 1 && (
                            <span
                              className={cn(
                                "w-0.5 flex-1",
                                step.completed ? "bg-emerald-400" : "bg-slate-200"
                              )}
                              style={{ minHeight: 24 }}
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              step.active
                                ? "text-blue-600"
                                : step.completed
                                  ? "text-emerald-700"
                                  : "text-slate-700"
                            )}
                          >
                            {step.label}
                          </p>
                          {step.description && (
                            <p className="text-xs text-slate-500 leading-snug">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}