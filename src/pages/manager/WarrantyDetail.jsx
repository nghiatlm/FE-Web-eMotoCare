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
import { getRmaById, updateRma, updateRmaDetail } from "@/api/rmasApi";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailApprovalTarget, setDetailApprovalTarget] = useState(null);
  const [detailRejectionTarget, setDetailRejectionTarget] = useState(null);
  const [detailRejectionReason, setDetailRejectionReason] = useState("");
  const [showDetailList, setShowDetailList] = useState(false);
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

  const translateKeyword = (value) => {
    if (!value) return value;
    switch (value.toUpperCase()) {
      case "CHECK":
        return "Kiểm tra";
      case "COMPLETED":
        return "Hoàn thành";
      case "ACTIVE":
        return "Khả dụng";
      default:
        return value;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return (
          <span className="inline-flex">
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              Đang chờ duyệt
            </Badge>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex">
            <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đang xử lý
            </Badge>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex">
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full">
              <XCircle className="h-3.5 w-3.5" />
              Đã từ chối
            </Badge>
          </span>
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

  const totalSerials =
    rma.rmaDetails?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) ||
    0;
  const partCount = rma.rmaDetails?.length || 0;

  const currentStatus = (rma.status || "PENDING").toUpperCase();
  const normalizedStatus = currentStatus === "APPROVED" ? "PROCESSING" : currentStatus;
  const statusInfo = STATUS_META[normalizedStatus] || STATUS_META.DEFAULT;
  const StatusHeroIcon = statusInfo.icon || Clock;
  const statusDescription = statusInfo.description;

  const returnAddress = rma.returnAddress || "—";
  const createdAt = formatDateTime(rma.rmaDate);
  const updatedAt = formatDateTime(rma.updatedAt);

  const staffDisplayName = staffName || "Chưa xác định";

  const noteContent = rma.note || "Chưa có ghi chú cho yêu cầu này.";

  const customerFirstName =
    rma.customer?.firstName ||
    rma.customer?.first_name ||
    rma.customer?.account?.firstName ||
    "";
  const customerLastName =
    rma.customer?.lastName ||
    rma.customer?.last_name ||
    rma.customer?.account?.lastName ||
    "";
  const customerFullName = [customerFirstName, customerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const customerPhone =
    rma.customer?.phone ||
    rma.customer?.account?.phone ||
    rma.customer?.account?.phoneNumber ||
    rma.customerPhone ||
    "";
  const customerEmail =
    rma.customer?.email ||
    rma.customer?.account?.email ||
    rma.customerEmail ||
    "";
  const customerAddress =
    rma.customer?.address || rma.customerAddress || rma.customer?.account?.address || "";

  const vehicleModelName =
    rma.vehicle?.modelName ||
    rma.vehicle?.model?.name ||
    rma.vehicleModelName ||
    "";
  const vehicleDisplayName =
    rma.vehicle?.name || vehicleModelName || rma.vehicleName || "";
  const vehicleFrameNumber =
    rma.vehicle?.frameNumber ||
    rma.vehicle?.chassisNumber ||
    rma.vehicleFrameNumber ||
    rma.vehicle?.frameNo ||
    "";
  const vehicleLicensePlate =
    rma.vehicle?.licensePlate || rma.vehicleLicensePlate || "";
  const vehicleWarrantyTo =
    rma.vehicle?.warrantyEnd ||
    rma.vehicleWarrantyEndDate ||
    rma.vehicle?.warrantyExpiry;

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
      name: customerFullName || rma.customer?.name || rma.customerName || "",
      code: rma.customer?.customerCode || rma.customerCode || "",
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
      citizenId: rma.customer?.citizenId || "",
      dateOfBirth: formatDateOnly(rma.customer?.dateOfBirth),
      gender: translateGender(rma.customer?.gender),
    },
    vehicle: {
      name: vehicleDisplayName,
      modelName: vehicleModelName,
      color: rma.vehicle?.color || rma.vehicleColor || "",
      vin: rma.vehicle?.vin || rma.vehicleVin || "",
      frameNumber: vehicleFrameNumber,
      licensePlate: vehicleLicensePlate,
      engineNumber: rma.vehicle?.engineNumber || rma.vehicleEngineNumber || "",
      status: translateKeyword(rma.vehicle?.status || rma.vehicleStatus || ""),
      manufactureDate: formatDateOnly(rma.vehicle?.manufactureDate),
      purchaseDate: formatDateOnly(rma.vehicle?.purchaseDate),
      warrantyStatus: translateKeyword(rma.vehicle?.warrantyStatus || rma.vehicleWarrantyStatus || ""),
      warrantyFrom: rma.vehicle?.warrantyStart
        ? formatDateOnly(rma.vehicle.warrantyStart)
        : formatDateOnly(rma.vehicleWarrantyStartDate),
      warrantyTo: vehicleWarrantyTo ? formatDateOnly(vehicleWarrantyTo) : "—",
      warrantyExpiry: formatDateOnly(rma.vehicle?.warrantyExpiry),
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
      warrantyStatus: translateKeyword(rma.part?.warrantyStatus || rma.partWarrantyStatus || ""),
      policy: translateKeyword(rma.part?.policy || rma.partWarrantyPolicy || ""),
      warrantyFrom: rma.part?.warrantyStart ? formatDateOnly(rma.part.warrantyStart) : formatDateOnly(rma.partWarrantyStartDate),
      warrantyTo: rma.part?.warrantyEnd ? formatDateOnly(rma.part.warrantyEnd) : formatDateOnly(rma.partWarrantyEndDate),
      condition: translateKeyword(rma.part?.condition || rma.partCondition || ""),
    },
  };

  const generalOverviewRows = [
    { label: "Mã yêu cầu", value: detailInfo.request.code },
    { label: "Ngày tạo", value: detailInfo.request.createdAt },
    { label: "Trạng thái", value: getStatusBadge(rma.status) },
    { label: "Địa chỉ trả hàng", value: returnAddress },
  ];

  const customerItems = [
    { label: "Mã khách hàng", value: detailInfo.customer.code },
    { label: "Họ tên", value: detailInfo.customer.name },
    { label: "Số điện thoại", value: detailInfo.customer.phone },
    { label: "Email", value: detailInfo.customer.email },
    { label: "CMND/CCCD", value: detailInfo.customer.citizenId },
    { label: "Ngày sinh", value: detailInfo.customer.dateOfBirth },
    { label: "Giới tính", value: detailInfo.customer.gender },
    { label: "Địa chỉ", value: detailInfo.customer.address },
  ];

  const vehicleItems = [
    { label: "Mẫu xe", value: detailInfo.vehicle.name || detailInfo.vehicle.modelName },
    { label: "Màu sắc", value: detailInfo.vehicle.color },
    { label: "Số khung", value: detailInfo.vehicle.frameNumber },
    { label: "Số máy", value: detailInfo.vehicle.engineNumber },
    { label: "Biển số", value: detailInfo.vehicle.licensePlate },
    { label: "Trạng thái", value: detailInfo.vehicle.status },
    { label: "Ngày sản xuất", value: detailInfo.vehicle.manufactureDate },
    { label: "Ngày mua", value: detailInfo.vehicle.purchaseDate },
    { label: "Tình trạng bảo hành", value: detailInfo.vehicle.warrantyStatus },
    { label: "Bảo hành từ", value: detailInfo.vehicle.warrantyFrom },
    { label: "Bảo hành đến", value: detailInfo.vehicle.warrantyTo },
    { label: "Hết hạn bảo hành", value: detailInfo.vehicle.warrantyExpiry },
  ];

  const partItems = [
    { label: "Code", value: detailInfo.part.code },
    { label: "Serial", value: detailInfo.part.serial },
    { label: "Tên phụ tùng", value: detailInfo.part.name },
    { label: "Ngày sản xuất", value: detailInfo.part.productionDate },
    { label: "Tình trạng", value: detailInfo.part.warrantyStatus },
    { label: "Chính sách", value: detailInfo.part.policy },
    { label: "Bảo hành từ", value: detailInfo.part.warrantyFrom },
    { label: "Bảo hành đến", value: detailInfo.part.warrantyTo },
    { label: "Mô tả tình trạng", value: detailInfo.part.condition },
  ];

  const buildDetailPayload = (detail, overrides = {}) => ({
    status: overrides.status || detail.status,
    quantity: detail.quantity,
    reason: detail.reason,
    rmaNumber: detail.rmaNumber,
    releaseDateRMA: detail.releaseDateRMA,
    expirationDateRMA: detail.expirationDateRMA,
    inspector: detail.inspector || "",
    result: detail.result || "",
    solution:
      overrides.solution !== undefined
        ? overrides.solution
        : detail.solution || "",
  });

  const handleDetailApprove = async () => {
    if (!detailApprovalTarget) return;
    setIsProcessing(true);
    try {
      await updateRmaDetail(
        detailApprovalTarget.id,
        buildDetailPayload(detailApprovalTarget, { status: "APPROVED" })
      );
      await fetchRmaDetail();
      toast({
        title: "Thành công",
        description: `Đã duyệt chi tiết ${detailApprovalTarget.rmaNumber || ""}`,
      });
      setDetailApprovalTarget(null);
    } catch (error) {
      console.error("Error approving RMA detail:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message || "Không thể duyệt chi tiết RMA",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetailReject = async () => {
    if (!detailRejectionTarget) return;
    if (!detailRejectionReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateRmaDetail(
        detailRejectionTarget.id,
        buildDetailPayload(detailRejectionTarget, {
          status: "REJECTED",
          solution: detailRejectionReason.trim(),
        })
      );
      await fetchRmaDetail();
      toast({
        title: "Thành công",
        description: `Đã từ chối chi tiết ${
          detailRejectionTarget.rmaNumber || ""
        }`,
      });
      setDetailRejectionTarget(null);
      setDetailRejectionReason("");
    } catch (error) {
      console.error("Error rejecting RMA detail:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message || "Không thể từ chối chi tiết RMA",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const InfoTable = ({ rows }) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => {
        const display =
          row.value || row.value === 0 ? row.value : row.fallback || "—";
        const isComponent =
          typeof display !== "string" && typeof display !== "number";
        return (
          <div
            key={row.label}
            className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {row.label}
            </dt>
            <dd
              className={cn(
                "mt-2 text-base font-semibold",
                !isComponent && display === "—"
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {display}
            </dd>
          </div>
        );
      })}
    </div>
  );

  const InfoBlock = ({ title, icon: Icon, items }) => (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const display = item.value || item.value === 0 ? item.value : "—";
          const isEmpty = display === "—";
          return (
            <div
              key={item.label}
              className="rounded-xl border border-border/40 bg-background/70 p-3"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd
                className={cn(
                  "mt-1 text-sm font-semibold leading-tight",
                  isEmpty ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {display}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-4 py-6 sm:px-6 lg:px-10 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/manager/warranty")} className="mb-6 hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>

        {/* Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", statusInfo.gradient)} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/90 bg-white/95 shadow-lg backdrop-blur-sm">
                  <StatusHeroIcon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mã yêu cầu</span>
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-bold text-foreground">{rma.code}</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl mb-3">Chi tiết yêu cầu bảo hành</h1>
                <p className="text-base text-muted-foreground leading-relaxed">{statusDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md backdrop-blur-sm border-2", statusInfo.pill)}>
                  <StatusHeroIcon className="h-4 w-4" />
                  {STATUS_META[currentStatus]?.label || statusInfo.label}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground shadow-md backdrop-blur-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {createdAt}
                </span>
                {staffName && (
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground shadow-md backdrop-blur-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {staffName}
                  </span>
                )}
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-white/80 bg-white/90 backdrop-blur-sm px-5 py-5 text-foreground shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tổng serial</p>
              </div>
                <p className="text-3xl font-bold text-primary mb-1">{totalSerials}</p>
                <p className="text-xs text-muted-foreground leading-tight">Đang được quản lý trong yêu cầu</p>
              </div>
              <div className="rounded-2xl border-2 border-white/80 bg-white/90 backdrop-blur-sm px-5 py-5 text-foreground shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số phụ tùng</p>
              </div>
                <p className="text-3xl font-bold text-primary mb-1">{partCount}</p>
                <p className="text-xs text-muted-foreground leading-tight">Đính kèm trong yêu cầu</p>
            </div>
              <div className="col-span-2 rounded-2xl border-2 border-white/80 bg-white/90 backdrop-blur-sm px-5 py-4 text-foreground shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ trả hàng</p>
                </div>
                <p className="text-sm font-medium leading-relaxed">{returnAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Thông tin yêu cầu */}
            <Card className="border-border/60 shadow-lg bg-card">
              <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Thông tin yêu cầu</CardTitle>
                    <CardDescription className="mt-1">Tổng quan chi tiết của yêu cầu bảo hành</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <InfoTable rows={generalOverviewRows} />

                {detailInfo.request.description && (
                  <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-sm text-foreground">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                      Mô tả yêu cầu
                    </p>
                    {detailInfo.request.description}
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <InfoBlock title="Khách hàng" icon={User} items={customerItems} />
                  <InfoBlock title="Phương tiện" icon={ScooterIcon} items={vehicleItems} />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="rounded-xl border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => setShowDetailList((prev) => !prev)}
                  >
                    {showDetailList ? "Ẩn chi tiết RMA" : "Xem chi tiết RMA"}
                  </Button>
                </div>

                {detailInfo.relatedStaffs?.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <UsersIcon className="h-4 w-4 text-primary" />
                      Nhân viên liên quan
                    </div>
                    <div className="space-y-4">
                      {detailInfo.relatedStaffs.map((staff, index) => (
                        <div
                          key={`${staff.id || index}`}
                          className="rounded-lg border border-border/50 px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {`${staff.firstName || ""} ${staff.lastName || ""}`.trim() || "—"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Mã NV: {staff.staffCode || staff.code || "—"}</span>
                            <span>Chức vụ: {translatePosition(staff.position)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(detailInfo.part.code || detailInfo.part.serial || detailInfo.part.name) && (
                  <InfoBlock title="Thông tin bộ phận" icon={Package} items={partItems} />
                )}

                {/* Chi tiết RMA */}
                {showDetailList && rma.rmaDetails && rma.rmaDetails.length > 0 && rma.rmaDetails.map((detail, index) => {
                  const evCheckDetail = detail.evCheckDetail;
                  const partItem = evCheckDetail?.partItem;
                  const replacePart = evCheckDetail?.replacePart;
                  const rmaNumber = detail.rmaNumber || "—";
                  const quantity = detail.quantity || 0;
                  const reason = detail.reason ? translateKeyword(detail.reason) : "—";
                  const releaseDate = formatDateTime(detail.releaseDateRMA);
                  const expirationDate = formatDateTime(detail.expirationDateRMA);
                  const inspector = detail.inspector || "—";
                  const result = detail.result ? translateKeyword(detail.result) : "—";
                  const solution = detail.solution ? translateKeyword(detail.solution) : "—";
                  const detailStatus = detail.status || "—";
                  const detailStatusUpper = (detailStatus || "").toUpperCase();
                  const isPendingDetail = detailStatusUpper === "PENDING";
                  
                  // EvCheckDetail info
                  const remedies = evCheckDetail?.remedies ? translateKeyword(evCheckDetail.remedies) : "—";
                  const unit = evCheckDetail?.unit || "—";
                  const evQuantity = evCheckDetail?.quantity || 0;
                  const pricePart = evCheckDetail?.pricePart || 0;
                  const priceService = evCheckDetail?.priceService || 0;
                  const totalAmount = evCheckDetail?.totalAmount || 0;
                  const evStatus = evCheckDetail?.status ? translateKeyword(evCheckDetail.status) : "—";
                  
                  // PartItem info
                  const partItemSerial = partItem?.serialNumber || "—";
                  const partItemPrice = formatCurrency(partItem?.price);
                  const partItemWarrantyStart = formatDateOnly(partItem?.warantyStartDate);
                  const partItemWarrantyEnd = formatDateOnly(partItem?.warantyEndDate);
                  const partItemStatus = partItem?.status ? translateKeyword(partItem.status) : "—";
                  
                  // ReplacePart info
                  const replacePartSerial = replacePart?.serialNumber || "—";
                  const replacePartPrice = formatCurrency(replacePart?.price);
                  const replacePartWarrantyStart = formatDateOnly(replacePart?.warantyStartDate);
                  const replacePartWarrantyEnd = formatDateOnly(replacePart?.warantyEndDate);
                  const replacePartStatus = replacePart?.status ? translateKeyword(replacePart.status) : "—";

                  const getStatusBadgeForDetail = (status) => {
                    const statusUpper = (status || "").toUpperCase();
                    switch (statusUpper) {
                      case "PENDING":
                        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xử lý</Badge>;
                      case "PROCESSING":
                      case "IN_PROGRESS":
                        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đang xử lý</Badge>;
                      case "COMPLETED":
                      case "ACTIVE":
                        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
                      default:
                        return <Badge variant="secondary">{translateKeyword(status) || "—"}</Badge>;
                    }
                  };

                  return (
                    <div key={detail.id || index} className="space-y-6">
                      {/* Header của chi tiết RMA */}
                      <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                                <Hash className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-foreground">
                                  Chi tiết RMA #{index + 1}: {rmaNumber}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Thông tin chi tiết về RMA</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="border border-primary/30 bg-primary/5 text-primary font-semibold px-4 py-1.5">
                                Số lượng: {quantity}
                              </Badge>
                              {getStatusBadgeForDetail(detailStatus)}
                              {isPendingDetail && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => setDetailApprovalTarget(detail)}
                                  >
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                    onClick={() => {
                                      setDetailRejectionTarget(detail);
                                      setDetailRejectionReason("");
                                    }}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Từ chối
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lý do</p>
                              </div>
                              <p className="text-sm font-medium text-foreground leading-relaxed">{reason}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Người kiểm tra</p>
                              </div>
                              <p className="text-sm font-medium text-foreground">{inspector}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ngày phát hành RMA</p>
                              </div>
                              <p className="text-sm font-medium text-foreground">{releaseDate}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ngày hết hạn RMA</p>
                              </div>
                              <p className="text-sm font-medium text-foreground">{expirationDate}</p>
                            </div>
                            {(result && result !== "—") && (
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kết quả</p>
                                </div>
                                <p className="text-sm font-medium text-foreground leading-relaxed">{result}</p>
                              </div>
                            )}
                            {(solution && solution !== "—") && (
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giải pháp</p>
                                </div>
                                <p className="text-sm font-medium text-foreground leading-relaxed">{solution}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* EvCheckDetail */}
                      {evCheckDetail && (
                        <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-foreground">Chi tiết kiểm tra sơ bộ</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Thông tin kiểm tra và khắc phục</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              {(remedies && remedies !== "—") && (
                                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Biện pháp khắc phục</p>
                                  <p className="text-sm font-medium text-foreground">{remedies}</p>
                                </div>
                              )}
                              {(unit && unit !== "—") && (
                                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Đơn vị</p>
                                  <p className="text-sm font-medium text-foreground">{unit}</p>
                                </div>
                              )}
                              {evQuantity > 0 && (
                                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Số lượng</p>
                                  <p className="text-sm font-medium text-foreground">{evQuantity}</p>
                                </div>
                              )}
                              {(evStatus && evStatus !== "—") && (
                                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Trạng thái</p>
                                  <p className="text-sm font-medium text-foreground">{evStatus}</p>
                                </div>
                              )}
                              {pricePart > 0 && (
                                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Giá phụ tùng</p>
                                  <p className="text-sm font-medium text-foreground">{formatCurrency(pricePart)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PartItem */}
                      {partItem && (
                        <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-foreground">Phụ tùng cần bảo hành</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Thông tin phụ tùng ban đầu</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                              <div className="flex flex-wrap items-center gap-3">
                                {partItem?.part?.image && (
                                  <img
                                    src={partItem.part.image}
                                    alt={partItem.part.name || "Part image"}
                                    className="h-16 w-16 rounded-lg object-cover border border-border/50"
                                  />
                                )}
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tên phụ tùng</p>
                                  <p className="text-base font-semibold text-foreground">
                                    {partItem?.part?.name || "—"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Mã: {partItem?.part?.code || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Số serial</p>
                                <p className="text-sm font-medium text-foreground break-all">{partItemSerial}</p>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Trạng thái</p>
                                <p className="text-sm font-medium text-foreground">{partItemStatus}</p>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BH từ</p>
                                </div>
                                <p className="text-sm font-medium text-foreground">{partItemWarrantyStart}</p>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BH đến</p>
                                </div>
                                <p className="text-sm font-medium text-foreground">{partItemWarrantyEnd}</p>
                              </div>
                              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Mô tả / ghi chú</p>
                                <p className="text-sm font-medium text-foreground leading-relaxed">
                                  {partItem?.part?.description || partItem?.note || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
                {showDetailList && (!rma.rmaDetails || rma.rmaDetails.length === 0) && (
                  <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    Chưa có chi tiết RMA nào.
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Nhân viên phụ trách */}
            <Card className="border-border/60 shadow-lg bg-card">
              <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Nhân viên phụ trách</CardTitle>
                    <CardDescription className="mt-1">Nguồn yêu cầu được tạo từ cửa hàng</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-bold text-primary shadow-lg border-2 border-primary/20">
                    {staffInitials}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-foreground mb-2">{staffDisplayName}</p>
                    <div className="flex flex-wrap gap-2">
                      {staffPositionLabel && (
                        <Badge className="border-2 border-primary/30 bg-primary/10 text-primary font-medium px-3 py-1">
                          {staffPositionLabel}
                        </Badge>
                      )}
                      {staffGenderLabel && (
                        <Badge variant="outline" className="border-2 border-border/70 text-muted-foreground font-medium px-3 py-1">
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

            {/* Ghi chú */}
            <Card className="border-border/60 shadow-lg bg-card">
              <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Ghi chú</CardTitle>
                    <CardDescription className="mt-1">Các ghi chú bổ sung cho yêu cầu bảo hành</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-6 text-sm leading-relaxed text-foreground shadow-sm">
                  {noteContent}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      <Dialog
        open={!!detailApprovalTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDetailApprovalTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt chi tiết RMA</DialogTitle>
            <DialogDescription>
              Xác nhận duyệt chi tiết {detailApprovalTarget?.rmaNumber || ""}.
            </DialogDescription>
          </DialogHeader>
          {detailApprovalTarget && (
            <div className="space-y-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
              <p>
                <span className="font-semibold">Phụ tùng:</span>{" "}
                {detailApprovalTarget.evCheckDetail?.partItem?.part?.name ||
                  detailApprovalTarget.reason ||
                  "—"}
              </p>
              <p>
                <span className="font-semibold">Số lượng:</span>{" "}
                {detailApprovalTarget.quantity}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailApprovalTarget(null)}
              disabled={isProcessing}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleDetailApprove}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-600/90"
            >
              {isProcessing ? "Đang xử lý..." : "Duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detailRejectionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDetailRejectionTarget(null);
            setDetailRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối chi tiết RMA</DialogTitle>
            <DialogDescription>
              Ghi rõ lý do để nhân viên cửa hàng nắm thông tin.
            </DialogDescription>
          </DialogHeader>
          {detailRejectionTarget && (
            <div className="space-y-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
              <p>
                <span className="font-semibold">Chi tiết:</span>{" "}
                {detailRejectionTarget.rmaNumber || "—"}
              </p>
              <p>
                <span className="font-semibold">Phụ tùng:</span>{" "}
                {detailRejectionTarget.evCheckDetail?.partItem?.part?.name ||
                  "—"}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="detailRejectReason">Lý do từ chối *</Label>
            <Textarea
              id="detailRejectReason"
              placeholder="Nhập lý do từ chối..."
              value={detailRejectionReason}
              onChange={(e) => setDetailRejectionReason(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-right text-xs text-muted-foreground">
              {detailRejectionReason.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailRejectionTarget(null);
                setDetailRejectionReason("");
              }}
              disabled={isProcessing}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDetailReject}
              disabled={isProcessing}
            >
              {isProcessing ? "Đang xử lý..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


