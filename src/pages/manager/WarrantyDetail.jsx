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
  Package,
  MapPin,
  Hash,
  Flag as FlagIcon,
  MessageSquare as MessageSquareIcon,
  Users as UsersIcon,
  Bike as ScooterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRmaById, updateRma } from "@/api/rmasApi";

const STATUS_META = {
  PENDING: {
    label: "Đang chờ duyệt",
    description: "Yêu cầu đang đợi quản lý xem xét và phê duyệt.",
    pill: "bg-amber-500/10 text-amber-600 border border-amber-200",
    gradient: "from-amber-50 via-white to-white",
    icon: Clock,
    panelBorder: "border-amber-200",
    panelBg: "bg-amber-50/60",
    panelText: "text-amber-700",
    panelMuted: "text-amber-600",
  },
  PROCESSING: {
    label: "Đang xử lý",
    description: "Yêu cầu đang trong quá trình xử lý và theo dõi.",
    pill: "bg-sky-500/10 text-sky-600 border border-sky-200",
    gradient: "from-sky-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-sky-200",
    panelBg: "bg-sky-50/70",
    panelText: "text-sky-700",
    panelMuted: "text-sky-600",
  },
  APPROVED: {
    label: "Đang xử lý",
    description: "Yêu cầu đang trong quá trình xử lý và theo dõi.",
    pill: "bg-sky-500/10 text-sky-600 border border-sky-200",
    gradient: "from-sky-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-sky-200",
    panelBg: "bg-sky-50/70",
    panelText: "text-sky-700",
    panelMuted: "text-sky-600",
  },
  REJECTED: {
    label: "Đã từ chối",
    description: "Yêu cầu bị từ chối. Vui lòng kiểm tra ghi chú để biết chi tiết.",
    pill: "bg-rose-500/10 text-rose-600 border border-rose-200",
    gradient: "from-rose-50 via-white to-white",
    icon: XCircle,
    panelBorder: "border-rose-200",
    panelBg: "bg-rose-50/60",
    panelText: "text-rose-700",
    panelMuted: "text-rose-600",
  },
  DEFAULT: {
    label: "Không xác định",
    description: "Trạng thái hiện tại của yêu cầu chưa xác định.",
    pill: "bg-muted text-muted-foreground border border-muted",
    gradient: "from-muted via-background to-background",
    icon: Clock,
    panelBorder: "border-border/70",
    panelBg: "bg-muted/40",
    panelText: "text-muted-foreground",
    panelMuted: "text-muted-foreground/80",
  },
};

const STATUS_FLOW = [
  {
    key: "PENDING",
    label: "Tiếp nhận yêu cầu",
    description: "Đơn được tạo bởi nhân viên cửa hàng và chờ xét duyệt.",
    icon: Clock,
  },
  {
    key: "PROCESSING",
    label: "Đang xử lý",
    description: "Yêu cầu đang được xử lý theo quy trình bảo hành.",
    icon: CheckCircle2,
  },
  {
    key: "REJECTED",
    label: "Từ chối yêu cầu",
    description: "Yêu cầu không đạt yêu cầu bảo hành. Xem ghi chú để biết lý do.",
    icon: XCircle,
  },
];

const defaultWarrantyInfo = {
  request: {
    code: "",
    priority: "",
    status: "",
    policyName: "",
    description: "",
    createdAt: "",
  },
  customer: {
    name: "",
    phone: "",
    email: "",
    address: "",
  },
  vehicle: {
    name: "",
    vin: "",
    frameNumber: "",
    licensePlate: "",
    engineNumber: "",
    warrantyStatus: "",
    warrantyFrom: "",
    warrantyTo: "",
  },
  relatedStaffs: [],
  part: {
    code: "",
    serial: "",
    name: "",
    productionDate: "",
    warrantyStatus: "",
    policy: "",
    warrantyFrom: "",
    warrantyTo: "",
    condition: "",
  },
};

export default function WarrantyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rma, setRma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRmaDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getRmaById(id);
      const data = response?.data || response;
      setRma(data);
    } catch (err) {
      console.error("Error fetching RMA detail:", err);
      setError("Không thể tải thông tin RMA. Vui lòng thử lại sau.");
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin RMA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchRmaDetail();
  }, [fetchRmaDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error || !rma) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Button variant="ghost" onClick={() => navigate("/manager/warranty")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{error || "Không tìm thấy thông tin RMA"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const translatePosition = (position) => {
    switch (position) {
      case "TECHNICIAN_STAFF":
        return "Kỹ thuật viên";
      case "SERVICE_STAFF":
        return "Nhân viên dịch vụ";
      case "STORE_KEEPER":
        return "Thủ kho";
      case "MANAGER_BRANCH":
        return "Quản lý chi nhánh";
      default:
        return position || "Khác";
    }
  };

  const translateGender = (gender) => {
    switch (gender) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      default:
        return gender || "—";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1 text-lg px-4 py-2">
            <Clock className="h-4 w-4" />
            Chờ xác nhận
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 flex items-center gap-1 text-lg px-4 py-2">
            <CheckCircle2 className="h-4 w-4" />
            Đang xử lý
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 text-lg px-4 py-2">
            <XCircle className="h-4 w-4" />
            Đã từ chối
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const staffName = `${rma.staff?.firstName || ""} ${rma.staff?.lastName || ""}`.trim();
  const staffInitials = staffName
    ? staffName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "NV";
  const staffPositionLabel = translatePosition(rma.staff?.position);
  const staffGenderLabel = translateGender(rma.staff?.gender);
  const staffPhone = rma.staff?.phone;
  const staffEmail = rma.staff?.email;
  const staffAddress = rma.staff?.address;
  const staffCitizenId = rma.staff?.citizenId;

  const totalSerials = rma.rmaDetails?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0;
  const partCount = rma.rmaDetails?.length || 0;

  const currentStatus = (rma.status || "PENDING").toUpperCase();
  const normalizedStatus = currentStatus === "APPROVED" ? "PROCESSING" : currentStatus;
  const statusInfo = STATUS_META[normalizedStatus] || STATUS_META.DEFAULT;
  const StatusHeroIcon = statusInfo.icon || Clock;
  const statusDescription = statusInfo.description;

  const computeStepState = (stepKey) => {
    if (normalizedStatus === "REJECTED") {
      if (stepKey === "REJECTED") return "active";
      if (stepKey === "PENDING") return "complete";
      return "inactive";
    }

    if (normalizedStatus === "PROCESSING") {
      if (stepKey === "PROCESSING") return "active";
      if (stepKey === "PENDING") return "complete";
      if (stepKey === "REJECTED") return "inactive";
    }

    if (stepKey === "PENDING") return "active";
    if (stepKey === "PROCESSING") return "inactive";
    if (stepKey === "REJECTED") return "inactive";
    return "inactive";
  };

  const returnAddress = rma.returnAddress || "—";
  const createdAt = formatDateTime(rma.rmaDate);
  const updatedAt = formatDateTime(rma.updatedAt);

  const staffDisplayName = staffName || "Chưa xác định";

  const noteContent = rma.note || "Chưa có ghi chú cho yêu cầu này.";

  const detailInfo = {
    request: {
      code: rma.code || "",
      priority: rma.priority || "",
      status: normalizedStatus,
      policyName: rma.policyName || rma.warrantyPolicyName || "",
      description: rma.description || "",
      createdAt: createdAt !== "—" ? createdAt : "",
      updatedAt: updatedAt !== "—" ? updatedAt : "",
    },
    customer: {
      name: rma.customer?.name || rma.customerName || "",
      phone: rma.customer?.phone || rma.customerPhone || "",
      email: rma.customer?.email || rma.customerEmail || "",
      address: rma.customer?.address || rma.customerAddress || "",
    },
    vehicle: {
      name: rma.vehicle?.name || rma.vehicleName || "",
      vin: rma.vehicle?.vin || rma.vehicleVin || "",
      frameNumber: rma.vehicle?.frameNumber || rma.vehicleFrameNumber || rma.vehicle?.frameNo || "",
      licensePlate: rma.vehicle?.licensePlate || rma.vehicleLicensePlate || "",
      engineNumber: rma.vehicle?.engineNumber || rma.vehicleEngineNumber || "",
      warrantyStatus: rma.vehicle?.warrantyStatus || rma.vehicleWarrantyStatus || "",
      warrantyFrom: rma.vehicle?.warrantyStart ? formatDateOnly(rma.vehicle.warrantyStart) : formatDateOnly(rma.vehicleWarrantyStartDate),
      warrantyTo: rma.vehicle?.warrantyEnd ? formatDateOnly(rma.vehicle.warrantyEnd) : formatDateOnly(rma.vehicleWarrantyEndDate),
    },
    relatedStaffs: Array.isArray(rma.relatedStaffs)
      ? rma.relatedStaffs
      : Array.isArray(rma.approvers)
      ? rma.approvers
      : [],
    part: {
      code: rma.part?.code || rma.partCode || "",
      serial: rma.part?.serial || rma.partSerialNumber || "",
      name: rma.part?.name || rma.partName || "",
      productionDate: rma.part?.productionDate ? formatDateOnly(rma.part.productionDate) : formatDateOnly(rma.partProductionDate),
      warrantyStatus: rma.part?.warrantyStatus || rma.partWarrantyStatus || "",
      policy: rma.part?.policy || rma.partWarrantyPolicy || "",
      warrantyFrom: rma.part?.warrantyStart ? formatDateOnly(rma.part.warrantyStart) : formatDateOnly(rma.partWarrantyStartDate),
      warrantyTo: rma.part?.warrantyEnd ? formatDateOnly(rma.part.warrantyEnd) : formatDateOnly(rma.partWarrantyEndDate),
      condition: rma.part?.condition || rma.partCondition || "",
    },
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await updateRma(id, { status: "PROCESSING" });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái yêu cầu RMA sang Processing",
      });
      setIsConfirmDialogOpen(false);
      setRma((prev) => (prev ? { ...prev, status: "PROCESSING" } : prev));
      fetchRmaDetail();
    } catch (error) {
      console.error("Error approving RMA:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể cập nhật trạng thái yêu cầu RMA",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateRma(id, { status: "REJECTED", note: rejectionReason.trim() });
      toast({
        title: "Thành công",
        description: "Đã từ chối yêu cầu RMA",
      });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setRma((prev) => (prev ? { ...prev, status: "REJECTED", note: rejectionReason.trim() } : prev));
      fetchRmaDetail();
    } catch (error) {
      console.error("Error rejecting RMA:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể từ chối yêu cầu RMA",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const DetailRow = ({ label, value, icon: Icon, className, valueClassName }) => {
    const display = value || value === 0 ? value : "—";
    return (
      <div className={cn("flex items-start gap-2 text-sm", className)}>
        {Icon && <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-sm font-medium text-foreground", valueClassName)}>{display}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <Button variant="ghost" onClick={() => navigate("/manager/warranty")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg">
          <div className={cn("absolute inset-0 bg-gradient-to-r", statusInfo.gradient)} />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-inner">
                  <StatusHeroIcon className="h-5 w-5 text-primary" />
                </div>
                <span className="uppercase tracking-wide">RMA #{rma.code}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">Chi tiết yêu cầu bảo hành</h1>
                <p className="mt-3 text-muted-foreground">{statusDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur", statusInfo.pill)}>
                  <StatusHeroIcon className="h-4 w-4" />
                  {STATUS_META[currentStatus]?.label || statusInfo.label}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  {rma.code}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {createdAt}
                </span>
                {staffName && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {staffName}
                  </span>
                )}
              </div>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-foreground shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tổng serial</p>
                <p className="mt-1 text-2xl font-semibold">{totalSerials}</p>
                <p className="mt-1 text-xs text-muted-foreground">Đang được quản lý trong yêu cầu</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-foreground shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Số phụ tùng</p>
                <p className="mt-1 text-2xl font-semibold">{partCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">Đính kèm trong yêu cầu</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-foreground shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Địa chỉ trả hàng</p>
                <p className="mt-2 text-sm font-medium leading-relaxed">{returnAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin yêu cầu</CardTitle>
                <CardDescription>Tổng quan chi tiết của yêu cầu bảo hành.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  <div className="border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Thông tin chung
                  </div>
                  <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                    <DetailRow label="Mã yêu cầu" value={detailInfo.request.code} icon={Hash} />
                    <DetailRow label="Ngày tạo" value={detailInfo.request.createdAt} icon={Calendar} />
                    <DetailRow label="Ưu tiên" value={detailInfo.request.priority} icon={FlagIcon} />
                    <DetailRow label="Trạng thái" value={STATUS_META[normalizedStatus]?.label || detailInfo.request.status} icon={CheckCircle2} valueClassName="text-primary font-medium" />
                    <DetailRow label="Chính sách bảo hành" value={detailInfo.request.policyName} icon={FileText} />
                    <DetailRow label="Mô tả" value={detailInfo.request.description} icon={MessageSquareIcon} className="md:col-span-2" />
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <User className="h-4 w-4" />
                      Khách hàng
                    </div>
                    <div className="space-y-3 px-5 py-5">
                      <DetailRow label="Tên" value={detailInfo.customer.name} />
                      <DetailRow label="Số điện thoại" value={detailInfo.customer.phone} icon={Phone} />
                      <DetailRow label="Email" value={detailInfo.customer.email} icon={Mail} />
                      <DetailRow label="Địa chỉ" value={detailInfo.customer.address} icon={MapPin} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <ScooterIcon className="h-4 w-4" />
                      Phương tiện
                    </div>
                    <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
                      <DetailRow label="Tên xe" value={detailInfo.vehicle.name} />
                      <DetailRow label="Số khung" value={detailInfo.vehicle.frameNumber} />
                      <DetailRow label="Biển số" value={detailInfo.vehicle.licensePlate} />
                      <DetailRow label="Số máy" value={detailInfo.vehicle.engineNumber} />
                      <DetailRow label="Tình trạng BH" value={detailInfo.vehicle.warrantyStatus} />
                      <DetailRow label="BH từ" value={detailInfo.vehicle.warrantyFrom} />
                      <DetailRow label="BH đến" value={detailInfo.vehicle.warrantyTo} />
                    </div>
                  </div>
                </div>

                {detailInfo.relatedStaffs?.length > 0 && (
                  <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <UsersIcon className="h-4 w-4" />
                      Nhân viên liên quan
                    </div>
                    <div className="divide-y divide-border/60">
                      {detailInfo.relatedStaffs.map((staff, index) => (
                        <div key={index} className="grid gap-3 px-5 py-4 md:grid-cols-3">
                          <DetailRow label="Tên" value={`${staff.firstName || ""} ${staff.lastName || ""}`.trim()} />
                          <DetailRow label="Mã nhân viên" value={staff.staffCode || staff.code || ""} />
                          <DetailRow label="Chức vụ" value={translatePosition(staff.position)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Thông tin bộ phận
                  </div>
                  <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
                    <DetailRow label="Code" value={detailInfo.part.code} />
                    <DetailRow label="Serial" value={detailInfo.part.serial} />
                    <DetailRow label="Tên phụ tùng" value={detailInfo.part.name} />
                    <DetailRow label="Ngày sản xuất" value={detailInfo.part.productionDate} />
                    <DetailRow label="Tình trạng BH" value={detailInfo.part.warrantyStatus} />
                    <DetailRow label="Chính sách BH" value={detailInfo.part.policy} />
                    <DetailRow label="Thời gian BH từ" value={detailInfo.part.warrantyFrom} />
                    <DetailRow label="Thời gian BH đến" value={detailInfo.part.warrantyTo} />
                    <DetailRow label="Tình trạng" value={detailInfo.part.condition} className="md:col-span-2" />
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-2xl px-5 py-4 shadow-sm border",
                    statusInfo.panelBorder,
                    statusInfo.panelBg
                  )}
                >
                  <p className={cn("text-xs font-semibold uppercase tracking-wide", statusInfo.panelText)}>
                    Trạng thái hiện tại
                  </p>
                  <div className="mt-3">{getStatusBadge(rma.status)}</div>
                  <p className={cn("mt-2 text-sm", statusInfo.panelMuted)}>
                    Theo dõi tiến trình ở bảng bên phải để nắm rõ tình trạng xử lý.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Nhân viên phụ trách</CardTitle>
                <CardDescription>Nguồn yêu cầu được tạo từ cửa hàng.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {staffInitials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{staffDisplayName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {staffPositionLabel && (
                        <Badge className="border border-primary/20 bg-primary/10 text-primary">{staffPositionLabel}</Badge>
                      )}
                      {staffGenderLabel && (
                        <Badge variant="outline" className="border-border/70 text-muted-foreground">
                          {staffGenderLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Ngày sinh
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{formatDateOnly(rma.staff?.dateOfBirth)}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Mã nhân viên
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{rma.staff?.staffCode || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Địa chỉ
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">{staffAddress || "—"}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{staffPhone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{staffEmail || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">CMND/CCCD: {staffCitizenId || "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
                <CardDescription>Các ghi chú bổ sung cho yêu cầu bảo hành.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-5 py-6 text-sm leading-relaxed text-muted-foreground">
                  {noteContent}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Danh sách phụ tùng</CardTitle>
                <CardDescription>
                  {partCount > 0 ? `${partCount} phụ tùng được đính kèm trong yêu cầu.` : "Chưa có phụ tùng nào được đính kèm."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partCount > 0 ? (
                  rma.rmaDetails.map((detail, index) => {
                    const partName = detail.part?.name || detail.part?.code || "—";
                    const partCode = detail.part?.code || "—";
                    const serialNumber = detail.serialNumber || "—";
                    const quantity = detail.quantity || 0;
                    const price = formatCurrency(detail.price);
                    const warrantyStart = formatDateOnly(detail.warantyStartDate);
                    const warrantyEnd = formatDateOnly(detail.warantyEndDate);
                    return (
                      <div key={`${serialNumber}-${index}`} className="rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phụ tùng</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">{partName}</p>
                            <p className="text-xs text-muted-foreground">Mã phụ tùng: {partCode}</p>
                          </div>
                          <Badge className="border border-primary/20 bg-primary/10 text-primary">SL: {quantity}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                              <Hash className="h-3.5 w-3.5" />
                              Số serial
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground break-all">{serialNumber}</p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                              Đơn giá
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground">{price}</p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              Bảo hành
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {warrantyStart !== "—" || warrantyEnd !== "—" ? `${warrantyStart} - ${warrantyEnd}` : "Không có"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                    Chưa có phụ tùng nào được đính kèm cho yêu cầu bảo hành này.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="sticky top-20 self-start space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Tổng quan</CardTitle>
                <CardDescription>Thông tin nhanh về yêu cầu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                  <div className="mt-2 flex items-center gap-2">{getStatusBadge(rma.status)}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày tạo</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{createdAt}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Địa chỉ trả hàng</p>
                  <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">{returnAddress}</p>
                </div>
              </CardContent>
            </Card>

            {normalizedStatus === "PENDING" && (
              <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Thao tác nhanh</CardTitle>
                  <CardDescription>Phê duyệt hoặc từ chối yêu cầu này.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-amber-700">Kiểm tra kỹ thông tin phụ tùng trước khi xác nhận.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      className="h-10 gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-600/90"
                      onClick={() => setIsConfirmDialogOpen(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Duyệt RMA
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-10 gap-2 rounded-full"
                      onClick={() => setIsRejectDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Tiến trình xử lý</CardTitle>
                <CardDescription>Trạng thái xuyên suốt của yêu cầu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {STATUS_FLOW.map((step, index) => {
                  const state = computeStepState(step.key);
                  const isActive = state === "active";
                  const isComplete = state === "complete";
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                            isActive
                              ? "border-primary bg-primary text-primary-foreground shadow-lg"
                              : isComplete
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground"
                          )}
                        >
                          <StepIcon className="h-4 w-4" />
                        </div>
                        {index < STATUS_FLOW.length - 1 && (
                          <div
                            className={cn(
                              "mt-1 h-10 w-px",
                              isComplete || isActive ? "bg-primary/40" : "bg-border"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}> {step.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu RMA</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt yêu cầu bảo hành này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isProcessing}>
              Huỷ
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-600/90">
              {isProcessing ? "Đang xử lý..." : "Duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu RMA</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để thông báo tới nhân viên tạo yêu cầu này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Lý do từ chối *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground">{rejectionReason.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Đang xử lý..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


