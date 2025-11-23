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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    label: "Đã cập nhật hãng",
    description: "Yêu cầu đã được cập nhật hãng.",
    pill: "bg-green-500/10 text-green-600 border border-green-200",
    gradient: "from-green-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-green-200",
    panelBg: "bg-green-50/70",
    panelText: "text-green-700",
    panelMuted: "text-green-600",
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
  const [updatingDetailId, setUpdatingDetailId] = useState(null);
  const [rma, setRma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState(new Set());
  const [detailForms, setDetailForms] = useState({}); 

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

  const translateColor = (color) => {
    if (!color) return "—";
    const colorUpper = color.toUpperCase();
    switch (colorUpper) {
      case "BLUE":
        return "Xanh dương";
      case "RED":
        return "Đỏ";
      case "GREEN":
        return "Xanh lá";
      case "YELLOW":
        return "Vàng";
      case "BLACK":
        return "Đen";
      case "WHITE":
        return "Trắng";
      case "GRAY":
      case "GREY":
        return "Xám";
      case "SILVER":
        return "Bạc";
      case "GOLD":
        return "Vàng";
      case "ORANGE":
        return "Cam";
      case "PURPLE":
        return "Tím";
      case "PINK":
        return "Hồng";
      case "BROWN":
        return "Nâu";
      default:
        return color;
    }
  };

  const translateStatus = (status) => {
    if (!status || status === "—") return "—";
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "ACTIVE":
        return "Đang hoạt động";
      case "IN_ACTIVE":
      case "INACTIVE":
        return "Không hoạt động";
      case "PENDING":
        return "Chờ xử lý";
      case "PROCESSING":
      case "IN_PROGRESS":
        return "Đang xử lý";
      case "COMPLETED":
        return "Hoàn thành";
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Đã từ chối";
      case "CANCELLED":
      case "CANCELED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const translateRemedies = (remedies) => {
    if (!remedies || remedies === "—") return "—";
    const remediesUpper = remedies.toUpperCase();
    switch (remediesUpper) {
      case "NONE":
        return "Không có";
      case "REPAIR":
        return "Sửa chữa";
      case "REPLACE":
        return "Thay thế";
      case "REFUND":
        return "Hoàn tiền";
      default:
        return remedies;
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
  
  // Kiểm tra xem có rmaDetails nào đang PENDING không
  const hasPendingDetails = rma.rmaDetails?.some((detail) => 
    detail.status?.toUpperCase() === "PENDING"
  ) || false;

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
      name: rma.customer?.name || (rma.customer?.firstName && rma.customer?.lastName ? `${rma.customer.firstName} ${rma.customer.lastName}` : "") || rma.customerName || "",
      phone: rma.customer?.phone || rma.customer?.account?.phone || rma.customerPhone || "",
      email: rma.customer?.email || rma.customer?.account?.email || rma.customerEmail || "",
      address: rma.customer?.address || rma.customerAddress || "",
      customerCode: rma.customer?.customerCode || "",
      citizenId: rma.customer?.citizenId || "",
      dateOfBirth: rma.customer?.dateOfBirth ? formatDateOnly(rma.customer.dateOfBirth) : "",
      gender: rma.customer?.gender || "",
    },
    vehicle: {
      name: rma.vehicle?.modelName || rma.vehicle?.name || rma.vehicleName || "",
      vin: rma.vehicle?.vin || rma.vehicleVin || "",
      frameNumber: rma.vehicle?.chassisNumber || rma.vehicle?.frameNumber || rma.vehicleFrameNumber || rma.vehicle?.frameNo || "",
      licensePlate: rma.vehicle?.licensePlate || rma.vehicleLicensePlate || "",
      engineNumber: rma.vehicle?.engineNumber || rma.vehicleEngineNumber || "",
      color: rma.vehicle?.color || "",
      warrantyStatus: rma.vehicle?.status || rma.vehicle?.warrantyStatus || rma.vehicleWarrantyStatus || "",
      warrantyFrom: rma.vehicle?.warrantyStart ? formatDateOnly(rma.vehicle.warrantyStart) : formatDateOnly(rma.vehicleWarrantyStartDate),
      warrantyTo: rma.vehicle?.warrantyExpiry ? formatDateOnly(rma.vehicle.warrantyExpiry) : (rma.vehicle?.warrantyEnd ? formatDateOnly(rma.vehicle.warrantyEnd) : formatDateOnly(rma.vehicleWarrantyEndDate)),
      manufactureDate: rma.vehicle?.manufactureDate ? formatDateOnly(rma.vehicle.manufactureDate) : "",
      purchaseDate: rma.vehicle?.purchaseDate ? formatDateOnly(rma.vehicle.purchaseDate) : "",
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
    if (!rma?.rmaDetails || rma.rmaDetails.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có chi tiết RMA nào để duyệt",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Duyệt tất cả các rmaDetails có status PENDING
      const pendingDetails = rma.rmaDetails.filter((detail) => 
        detail.status?.toUpperCase() === "PENDING"
      );

      if (pendingDetails.length === 0) {
        toast({
          title: "Thông báo",
          description: "Không có chi tiết RMA nào đang chờ duyệt",
        });
        setIsConfirmDialogOpen(false);
        setIsProcessing(false);
        return;
      }

      const updatePromises = pendingDetails.map((detail) =>
        updateRmaDetail(detail.id, { 
          status: "APPROVED",
          quantity: detail.quantity,
          reason: detail.reason,
          rmaNumber: detail.rmaNumber,
          releaseDateRMA: detail.releaseDateRMA,
          expirationDateRMA: detail.expirationDateRMA,
          inspector: detail.inspector || "",
          result: detail.result || "",
          solution: detail.solution || "",
        })
      );

      await Promise.all(updatePromises);

      await fetchRmaDetail();

      toast({
        title: "Thành công",
        description: `Đã duyệt ${pendingDetails.length} chi tiết RMA`,
      });
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error approving RMA details:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể duyệt chi tiết RMA",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveDetail = async (detailId, detail) => {
    if (!detailId || !detail) return;
    
    setIsProcessing(true);
    setUpdatingDetailId(detailId);
    try {
      await updateRmaDetail(detailId, { 
        status: "APPROVED",
        quantity: detail.quantity,
        reason: detail.reason,
        rmaNumber: detail.rmaNumber,
        releaseDateRMA: detail.releaseDateRMA,
        expirationDateRMA: detail.expirationDateRMA,
        inspector: detail.inspector || "",
        result: detail.result || "",
        solution: detail.solution || "",
        evCheckDetailId: detail.evCheckDetailId || detail.evCheckDetail?.id,
        rmaId: detail.rmaId || rma?.id,
      });

      await fetchRmaDetail();

      toast({
        title: "Thành công",
        description: "Đã cập nhật hãng thành công",
      });
    } catch (error) {
      console.error("Error approving RMA detail:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể cập nhật hãng",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUpdatingDetailId(null);
    }
  };

  const handleFormChange = (detailId, field, value) => {
    setDetailForms(prev => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [field]: value,
      },
    }));
  };

  const handleSubmitHangInfo = async (detailId, detail) => {
    if (!detailId || !detail) return;
    
    const formData = detailForms[detailId] || {};
    
    setIsProcessing(true);
    setUpdatingDetailId(detailId);
    try {
      const payload = {
        status: "APPROVED", // Giữ nguyên status
        quantity: detail.quantity,
        reason: detail.reason,
        rmaNumber: formData.rmaNumber || detail.rmaNumber || "",
        releaseDateRMA: formData.releaseDateRMA || detail.releaseDateRMA || null,
        expirationDateRMA: formData.expirationDateRMA || detail.expirationDateRMA || null,
        inspector: formData.inspector || detail.inspector || "",
        result: formData.result || detail.result || "",
        solution: formData.solution || detail.solution || "",
        evCheckDetailId: detail.evCheckDetailId || detail.evCheckDetail?.id,
        rmaId: detail.rmaId || rma?.id,
      };

      await updateRmaDetail(detailId, payload);

      // Fetch lại dữ liệu để đảm bảo có data mới nhất
      await fetchRmaDetail();

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin hãng thành công",
      });
    } catch (error) {
      console.error("Error updating hang info:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể cập nhật thông tin hãng",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUpdatingDetailId(null);
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

    if (!rma?.rmaDetails || rma.rmaDetails.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có chi tiết RMA nào để từ chối",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Từ chối tất cả các rmaDetails có status PENDING
      const pendingDetails = rma.rmaDetails.filter((detail) => 
        detail.status?.toUpperCase() === "PENDING"
      );

      if (pendingDetails.length === 0) {
        toast({
          title: "Thông báo",
          description: "Không có chi tiết RMA nào đang chờ duyệt",
        });
        setIsRejectDialogOpen(false);
        setRejectionReason("");
        setIsProcessing(false);
        return;
      }

      // Cập nhật status của tất cả rmaDetails sang REJECTED và thêm solution là lý do từ chối
      const updatePromises = pendingDetails.map((detail) =>
        updateRmaDetail(detail.id, { 
          status: "REJECTED",
          quantity: detail.quantity,
          reason: detail.reason,
          rmaNumber: detail.rmaNumber,
          releaseDateRMA: detail.releaseDateRMA,
          expirationDateRMA: detail.expirationDateRMA,
          inspector: detail.inspector || "",
          result: detail.result || "",
          solution: rejectionReason.trim(),
        })
      );

      await Promise.all(updatePromises);

      // Fetch lại dữ liệu để đảm bảo có data mới nhất trước khi đóng dialog
      await fetchRmaDetail();

      toast({
        title: "Thành công",
        description: `Đã từ chối ${pendingDetails.length} chi tiết RMA`,
      });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting RMA details:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể từ chối chi tiết RMA",
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

        <div className="max-w-7xl mx-auto">
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
                {/* Thông tin chung */}
                <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
                  <div className="bg-muted/30 border-b border-border/60 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">Thông tin chung</h3>
                    </div>
                  </div>
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Mã yêu cầu</p>
                      </div>
                      <p className="text-base font-semibold text-foreground">{detailInfo.request.code}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Ngày tạo</p>
                      </div>
                      <p className="text-base font-semibold text-foreground">{detailInfo.request.createdAt}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <p className="text-sm text-muted-foreground">Trạng thái</p>
                      </div>
                      <p className="text-base font-semibold text-primary">{STATUS_META[normalizedStatus]?.label || detailInfo.request.status}</p>
                    </div>
                    {detailInfo.request.description && (
                      <div className="space-y-2 md:col-span-3">
                        <div className="flex items-center gap-2">
                          <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Mô tả</p>
                        </div>
                        <p className="text-base font-medium text-foreground leading-relaxed">{detailInfo.request.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Khách hàng và Phương tiện */}
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">Khách hàng</h3>
                    </div>
                    </div>
                    <div className="grid gap-3 px-6 py-5 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tên</p>
                        <p className="text-sm font-semibold text-foreground">{detailInfo.customer.name || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Số điện thoại</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{detailInfo.customer.phone || "—"}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Địa chỉ</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-relaxed">{detailInfo.customer.address || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ScooterIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">Phương tiện</h3>
                      </div>
                    </div>
                    <div className="grid gap-3 px-6 py-5 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tên xe</p>
                        <p className="text-sm font-semibold text-foreground">{detailInfo.vehicle.name || "—"}</p>
                      </div>
                      {detailInfo.vehicle.color && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Màu sắc</p>
                          <p className="text-sm font-semibold text-foreground">{translateColor(detailInfo.vehicle.color)}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Số khung</p>
                        <p className="text-sm font-semibold text-foreground">{detailInfo.vehicle.frameNumber || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Số máy</p>
                        <p className="text-sm font-semibold text-foreground">{detailInfo.vehicle.engineNumber || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {detailInfo.relatedStaffs?.length > 0 && (
                  <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">Nhân viên liên quan</h3>
                      </div>
                    </div>
                    <div className="divide-y divide-border/60">
                      {detailInfo.relatedStaffs.map((staff, index) => (
                        <div key={index} className="grid gap-4 px-6 py-5 md:grid-cols-3">
                          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tên</p>
                            <p className="text-sm font-medium text-foreground">{`${staff.firstName || ""} ${staff.lastName || ""}`.trim() || "—"}</p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Mã nhân viên</p>
                            <p className="text-sm font-medium text-foreground">{staff.staffCode || staff.code || "—"}</p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Chức vụ</p>
                            <p className="text-sm font-medium text-foreground">{translatePosition(staff.position)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thông tin bộ phận - chỉ hiển thị nếu có dữ liệu */}
                {(detailInfo.part.code || detailInfo.part.serial || detailInfo.part.name) && (
                  <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">Thông tin bộ phận</h3>
                  </div>
                  </div>
                    <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Code</p>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.code || "—"}</p>
                </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Serial</p>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.serial || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tên phụ tùng</p>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.name || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ngày sản xuất</p>
                        </div>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.productionDate || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tình trạng BH</p>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.warrantyStatus || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Chính sách BH</p>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.policy || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thời gian BH từ</p>
                        </div>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.warrantyFrom || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thời gian BH đến</p>
                        </div>
                        <p className="text-sm font-medium text-foreground">{detailInfo.part.warrantyTo || "—"}</p>
                      </div>
                      {detailInfo.part.condition && (
                        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tình trạng</p>
                          <p className="text-sm font-medium text-foreground leading-relaxed">{detailInfo.part.condition}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chi tiết RMA */}
                {rma.rmaDetails && rma.rmaDetails.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Chi tiết RMA</h3>
                    <div className="space-y-4">
                      {rma.rmaDetails.map((detail, index) => {
                            const evCheckDetail = detail.evCheckDetail;
                            const partItem = evCheckDetail?.partItem;
                            const replacePart = evCheckDetail?.replacePart;
                            const rmaNumber = detail.rmaNumber || "—";
                            const quantity = detail.quantity || 0;
                            const reason = detail.reason || "—";
                            const releaseDate = formatDateTime(detail.releaseDateRMA);
                            const expirationDate = formatDateTime(detail.expirationDateRMA);
                            const inspector = detail.inspector || "—";
                            const result = detail.result || "—";
                            const solution = detail.solution || "—";
                            const detailStatus = detail.status || "—";
                            
                            // EvCheckDetail info
                            const remedies = evCheckDetail?.remedies || "—";
                            const unit = evCheckDetail?.unit || "—";
                            const evQuantity = evCheckDetail?.quantity || 0;
                            const pricePart = evCheckDetail?.pricePart || 0;
                            const priceService = evCheckDetail?.priceService || 0;
                            const totalAmount = evCheckDetail?.totalAmount || 0;
                            const evStatus = evCheckDetail?.status || "—";
                            
                            // PartItem info
                            const partItemSerial = partItem?.serialNumber || "—";
                            const partItemPrice = formatCurrency(partItem?.price);
                            const partItemWarrantyStart = formatDateOnly(partItem?.warantyStartDate);
                            const partItemWarrantyEnd = formatDateOnly(partItem?.warantyEndDate);
                            const partItemStatus = partItem?.status || "—";
                            
                            // ReplacePart info
                            const replacePartSerial = replacePart?.serialNumber || "—";
                            const replacePartPrice = formatCurrency(replacePart?.price);
                            const replacePartWarrantyStart = formatDateOnly(replacePart?.warantyStartDate);
                            const replacePartWarrantyEnd = formatDateOnly(replacePart?.warantyEndDate);
                            const replacePartStatus = replacePart?.status || "—";

                            const getStatusBadgeForDetail = (status) => {
                              const statusUpper = (status || "").toUpperCase();
                              switch (statusUpper) {
                                case "PENDING":
                                  return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xử lý</Badge>;
                                case "PROCESSING":
                                case "IN_PROGRESS":
                                  return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đang xử lý</Badge>;
                                case "APPROVED":
                                  return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã cập nhật hãng</Badge>;
                                case "COMPLETED":
                                case "ACTIVE":
                                  return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
                                default:
                                  return <Badge variant="secondary">{status || "—"}</Badge>;
                              }
                            };

                            const detailId = detail.id || `detail-${index}`;
                            const isExpanded = expandedDetails.has(detailId);
                            const toggleExpand = () => {
                              const newExpanded = new Set(expandedDetails);
                              if (isExpanded) {
                                newExpanded.delete(detailId);
                              } else {
                                newExpanded.add(detailId);
                              }
                              setExpandedDetails(newExpanded);
                            };

                            return (
                              <div key={detailId} className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                                {/* Header - Thông tin cơ bản */}
                                <div 
                                  className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 px-6 py-4 cursor-pointer hover:from-primary/10 transition-colors"
                                  onClick={toggleExpand}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>
                                        {isExpanded ? (
                                          <ChevronUp className="h-5 w-5 text-primary" />
                                        ) : (
                                          <ChevronDown className="h-5 w-5 text-primary" />
                                        )}
                                      </Button>
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                                        <Hash className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                          <h3 className="text-base font-semibold text-foreground">
                                            RMA #{index + 1}: {rmaNumber}
                                          </h3>
                                          {getStatusBadgeForDetail(detailStatus)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Package className="h-3.5 w-3.5" />
                                            Số lượng: {quantity}
                                          </span>
                                          {reason && reason !== "—" && (
                                            <span className="line-clamp-1">Lý do: {reason}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {detailStatus?.toUpperCase() === "PENDING" && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApproveDetail(detailId, detail);
                                        }}
                                        disabled={isProcessing && updatingDetailId === detailId}
                                      >
                                        {isProcessing && updatingDetailId === detailId ? (
                                          <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Xác nhận
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Expanded Content */}
                                {isExpanded && (
                                  <div className="p-6 space-y-6">
                                    {/* Thông tin chi tiết RMA */}
                                    <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
                                      <div className="bg-muted/30 border-b border-border/60 px-5 py-3">
                                        <div className="flex items-center gap-2">
                                          <h3 className="text-base font-semibold text-foreground">Thông tin RMA</h3>
                                        </div>
                                      </div>
                                      <div className="grid gap-4 px-5 py-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                              <p className="text-sm text-muted-foreground">Lý do</p>
                                          </div>
                                          <p className="text-base font-semibold text-foreground leading-relaxed">{reason}</p>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Ngày phát hành</p>
                                          </div>
                                          <p className="text-base font-semibold text-foreground">{releaseDate}</p>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Ngày hết hạn</p>
                                          </div>
                                          <p className="text-base font-semibold text-foreground">{expirationDate}</p>
                                        </div>
                                        {(result && result !== "—") && (
                                          <div className="space-y-2 md:col-span-3">
                                            <div className="flex items-center gap-2">
                                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                              <p className="text-sm text-muted-foreground">Kết quả</p>
                                            </div>
                                            <p className="text-base font-medium text-foreground leading-relaxed">{result}</p>
                                          </div>
                                        )}
                                        {(solution && solution !== "—") && (
                                          <div className="space-y-2 md:col-span-3">
                                            <div className="flex items-center gap-2">
                                              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
                                              <p className="text-sm text-muted-foreground">Giải pháp</p>
                                            </div>
                                            <p className="text-base font-medium text-foreground leading-relaxed">{solution}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Form nhập thông tin hãng - chỉ hiển thị khi status là APPROVED */}
                                    {detailStatus?.toUpperCase() === "APPROVED" && (
                                      <div className="rounded-lg border-2 border-green-200 bg-green-50/30 shadow-sm overflow-hidden">
                                        <div className="bg-green-100/50 border-b border-green-200 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <h3 className="text-base font-semibold text-foreground">Phản hồi của hãng</h3>
                                          </div>
                                        </div>
                                        <div className="p-5 space-y-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor={`rmaNumber-${detailId}`}>Số RMA</Label>
                                              <Input
                                                id={`rmaNumber-${detailId}`}
                                                value={detailForms[detailId]?.rmaNumber || detail.rmaNumber || ""}
                                                onChange={(e) => handleFormChange(detailId, "rmaNumber", e.target.value)}
                                                placeholder="Nhập số RMA"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor={`inspector-${detailId}`}>Người kiểm tra</Label>
                                              <Input
                                                id={`inspector-${detailId}`}
                                                value={detailForms[detailId]?.inspector || detail.inspector || ""}
                                                onChange={(e) => handleFormChange(detailId, "inspector", e.target.value)}
                                                placeholder="Nhập tên người kiểm tra"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor={`releaseDate-${detailId}`}>Ngày phát hành RMA</Label>
                                              <Input
                                                id={`releaseDate-${detailId}`}
                                                type="date"
                                                value={detailForms[detailId]?.releaseDateRMA 
                                                  ? format(new Date(detailForms[detailId].releaseDateRMA), "yyyy-MM-dd")
                                                  : detail.releaseDateRMA 
                                                    ? format(new Date(detail.releaseDateRMA), "yyyy-MM-dd")
                                                    : ""}
                                                onChange={(e) => {
                                                  const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                                  handleFormChange(detailId, "releaseDateRMA", date);
                                                }}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor={`expirationDate-${detailId}`}>Ngày hết hạn RMA</Label>
                                              <Input
                                                id={`expirationDate-${detailId}`}
                                                type="date"
                                                value={detailForms[detailId]?.expirationDateRMA 
                                                  ? format(new Date(detailForms[detailId].expirationDateRMA), "yyyy-MM-dd")
                                                  : detail.expirationDateRMA 
                                                    ? format(new Date(detail.expirationDateRMA), "yyyy-MM-dd")
                                                    : ""}
                                                onChange={(e) => {
                                                  const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                                  handleFormChange(detailId, "expirationDateRMA", date);
                                                }}
                                              />
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label htmlFor={`result-${detailId}`}>Kết quả kiểm tra</Label>
                                            <Textarea
                                              id={`result-${detailId}`}
                                              value={detailForms[detailId]?.result || detail.result || ""}
                                              onChange={(e) => handleFormChange(detailId, "result", e.target.value)}
                                              placeholder="Nhập kết quả kiểm tra từ hãng"
                                              rows={3}
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor={`solution-${detailId}`}>Giải pháp</Label>
                                            <Textarea
                                              id={`solution-${detailId}`}
                                              value={detailForms[detailId]?.solution || detail.solution || ""}
                                              onChange={(e) => handleFormChange(detailId, "solution", e.target.value)}
                                              placeholder="Nhập giải pháp từ hãng (thay thế, sửa chữa, v.v.)"
                                              rows={3}
                                            />
                                          </div>

                                          <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setDetailForms(prev => {
                                                  const newForms = { ...prev };
                                                  delete newForms[detailId];
                                                  return newForms;
                                                });
                                              }}
                                              disabled={isProcessing && updatingDetailId === detailId}
                                            >
                                              Hủy
                                            </Button>
                                            <Button
                                              onClick={() => handleSubmitHangInfo(detailId, detail)}
                                              disabled={isProcessing && updatingDetailId === detailId}
                                              className="bg-green-600 hover:bg-green-700"
                                            >
                                              {isProcessing && updatingDetailId === detailId ? (
                                                <>
                                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                  Đang lưu...
                                                </>
                                              ) : (
                                                <>
                                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                                  Lưu thông tin
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* EvCheckDetail */}
                                    {evCheckDetail && (
                                      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
                                        <div className="bg-muted/30 border-b border-border/60 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-base font-semibold text-foreground">Chi tiết kiểm tra điện tử</h3>
                                          </div>
                                        </div>
                                        <div className="grid gap-4 px-5 py-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                          {(remedies && remedies !== "—") && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Biện pháp khắc phục</p>
                                              </div>
                                              <p className="text-base font-semibold text-foreground">{translateRemedies(remedies)}</p>
                                            </div>
                                          )}
                                          {evQuantity > 0 && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Số lượng</p>
                                              </div>
                                              <p className="text-base font-semibold text-foreground">{evQuantity}</p>
                                            </div>
                                          )}
                                          {(evStatus && evStatus !== "—") && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                              </div>
                                              <p className="text-base font-semibold text-foreground">{translateStatus(evStatus)}</p>
                                            </div>
                                          )}
                                          {priceService > 0 && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Giá dịch vụ</p>
                                              </div>
                                              <p className="text-base font-semibold text-foreground">{formatCurrency(priceService)}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* PartItem */}
                                    {partItem && (
                                      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
                                        <div className="bg-muted/30 border-b border-border/60 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-base font-semibold text-foreground">Phụ tùng gốc</h3>
                                          </div>
                                        </div>
                                        <div className="px-5 py-4 space-y-4">
                                          {(partItemSerial && partItemSerial !== "—") && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Số serial</p>
                                              </div>
                                              <p className="text-base font-semibold text-foreground break-all">{partItemSerial}</p>
                                            </div>
                                          )}
                                          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            {(partItemPrice && partItemPrice !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">Giá</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{partItemPrice}</p>
                                              </div>
                                            )}
                                            {(partItemStatus && partItemStatus !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{translateStatus(partItemStatus)}</p>
                                              </div>
                                            )}
                                            {(partItemWarrantyStart && partItemWarrantyStart !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">BH từ</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{partItemWarrantyStart}</p>
                                              </div>
                                            )}
                                            {(partItemWarrantyEnd && partItemWarrantyEnd !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">BH đến</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{partItemWarrantyEnd}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* ReplacePart */}
                                    {replacePart && (
                                      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
                                        <div className="bg-muted/30 border-b border-border/60 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-base font-semibold text-foreground">Phụ tùng thay thế</h3>
                                          </div>
                                        </div>
                                        <div className="px-5 py-4 space-y-4">
                                          {(replacePartSerial && replacePartSerial !== "—") && (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Số serial</p>
                                              </div>
                                              <p className="text-base font-semibold text-foreground break-all">{replacePartSerial}</p>
                                            </div>
                                          )}
                                          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            {(replacePartPrice && replacePartPrice !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">Giá</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{replacePartPrice}</p>
                                              </div>
                                            )}
                                            {(replacePartStatus && replacePartStatus !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{translateStatus(replacePartStatus)}</p>
                                              </div>
                                            )}
                                            {(replacePartWarrantyStart && replacePartWarrantyStart !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">BH từ</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{replacePartWarrantyStart}</p>
                                              </div>
                                            )}
                                            {(replacePartWarrantyEnd && replacePartWarrantyEnd !== "—") && (
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm text-muted-foreground">BH đến</p>
                                                </div>
                                                <p className="text-base font-semibold text-foreground">{replacePartWarrantyEnd}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

              </CardContent>
            </Card>

            {/* Nhân viên phụ trách */}
            <Card className="border-border/60 shadow-lg bg-card">
              <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Nhân viên phụ trách</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-base font-bold text-primary shadow-md border-2 border-primary/20">
                    {staffInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground mb-1.5">{staffDisplayName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {staffPositionLabel && (
                        <Badge className="border border-primary/30 bg-primary/10 text-primary text-xs px-2 py-0.5">
                          {staffPositionLabel}
                        </Badge>
                      )}
                      
                      {rma.staff?.staffCode && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {rma.staff.staffCode}
                        </span>
                      )}
                    </div>
                    {(staffPhone || staffEmail) && (
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {staffPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {staffPhone}
                          </span>
                        )}
                        {staffEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {staffEmail}
                          </span>
                        )}
                      </div>
                    )}
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


