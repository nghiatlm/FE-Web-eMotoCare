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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState, useEffect, useCallback } from "react";
import { toast as toastify } from "react-toastify";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRmaById, updateRmaDetail } from "@/api/rmasApi";
import { getParts, getPartById } from "@/api/partsApi";

const STATUS_META = {
  PENDING: {
    label: "Chờ xác nhận",
    description: "Yêu cầu bảo hành đang chờ quản lý xác nhận.",
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
    description: "Yêu cầu đang được xử lý tại trung tâm dịch vụ.",
    pill: "bg-sky-500/10 text-sky-600 border border-sky-200",
    gradient: "from-sky-50 via-white to-white",
    icon: Clock,
    panelBorder: "border-sky-200",
    panelBg: "bg-sky-50/70",
    panelText: "text-sky-700",
    panelMuted: "text-sky-600",
  },
  APPROVED: {
    label: "Đã duyệt",
    description: "Yêu cầu bảo hành đã được duyệt.",
    pill: "bg-emerald-500/10 text-emerald-600 border border-emerald-200",
    gradient: "from-emerald-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-emerald-200",
    panelBg: "bg-emerald-50/70",
    panelText: "text-emerald-700",
    panelMuted: "text-emerald-600",
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
  CANCELED: {
    label: "Đã hủy",
    description: "Yêu cầu bảo hành đã bị hủy.",
    pill: "bg-slate-500/10 text-slate-700 border border-slate-200",
    gradient: "from-slate-50 via-white to-white",
    icon: XCircle,
    panelBorder: "border-slate-200",
    panelBg: "bg-slate-50/60",
    panelText: "text-slate-700",
    panelMuted: "text-slate-600",
  },
  COMPLETED: {
    label: "Hoàn thành",
    description: "Yêu cầu bảo hành đã được xử lý xong.",
    pill: "bg-emerald-500/10 text-emerald-700 border border-emerald-200",
    gradient: "from-emerald-50 via-white to-white",
    icon: CheckCircle2,
    panelBorder: "border-emerald-200",
    panelBg: "bg-emerald-50/60",
    panelText: "text-emerald-700",
    panelMuted: "text-emerald-600",
  },
  APPOINTMENT_BOOKED: {
    label: "Đã đặt lịch",
    description: "Yêu cầu đã được đặt lịch xử lý tại trung tâm.",
    pill: "bg-blue-500/10 text-blue-700 border border-blue-200",
    gradient: "from-blue-50 via-white to-white",
    icon: Clock,
    panelBorder: "border-blue-200",
    panelBg: "bg-blue-50/60",
    panelText: "text-blue-700",
    panelMuted: "text-blue-600",
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

export default function WarrantyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [datePickerMonths, setDatePickerMonths] = useState({});
  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [openPartPopovers, setOpenPartPopovers] = useState({});
  const [partInfoMap, setPartInfoMap] = useState({});
  const [savedDetails, setSavedDetails] = useState(new Set()); 

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
  };

  const getDatePickerMonth = (detailId, fieldName, defaultDate = null) => {
    const key = `${detailId}-${fieldName}`;
    if (datePickerMonths[key]) {
      return datePickerMonths[key];
    }
    if (defaultDate) {
      return new Date(defaultDate);
    }
    return new Date();
  };

  const setDatePickerMonth = (detailId, fieldName, month) => {
    const key = `${detailId}-${fieldName}`;
    setDatePickerMonths(prev => ({
      ...prev,
      [key]: month
    }));
  };

  const toUtcDateISOString = (value) => {
    if (!value) return null;
    const dateObj = value instanceof Date ? value : new Date(value);
    return new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())).toISOString();
  }; 

  const fetchRmaDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getRmaById(id);
      const data = response?.data || response;
      setRma(data);
      
      if (data?.rmaDetails) {
        const savedDetailIds = new Set();
        data.rmaDetails.forEach((detail) => {
          if (detail.replacePart && detail.replacePart.id) {
            savedDetailIds.add(detail.id);
          }
        });
        setSavedDetails(savedDetailIds);
      }
    } catch (err) {
      console.error("Error fetching RMA detail:", err);
      setError("Không thể tải thông tin RMA. Vui lòng thử lại sau.");
      toastify.error("Không thể tải thông tin RMA");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRmaDetail();
  }, [fetchRmaDetail]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoadingParts(true);
        const response = await getParts({ page: 1, pageSize: 500, status: "ACTIVE" });
        const data = response?.data || response;
        const partsList = data?.rowDatas || data?.data || [];
        setParts(partsList);
      } catch (error) {
        setParts([]);
      } finally {
        setLoadingParts(false);
      }
    };
    fetchParts();
  }, []);

  useEffect(() => {
    if (!rma?.rmaDetails) return;

    const fetchPartInfos = async () => {
      const newPartInfoMap = {};
      const fetchPromises = [];

      rma.rmaDetails.forEach((detail) => {
        const partItem = detail.evCheckDetail?.partItem;
        const replacePart = detail.evCheckDetail?.replacePart;

        if (partItem) {
          if (partItem.part) {
            newPartInfoMap[partItem.part.id] = partItem.part;
          } else if (partItem.partId) {
            fetchPromises.push(
              getPartById(partItem.partId)
                .then((response) => {
                  const partData = response?.data?.data || response?.data || response;
                  if (partData) {
                    newPartInfoMap[partItem.partId] = partData;
                  }
                })
                .catch((error) => {
                  console.error("Error fetching part info for partItem:", error);
                })
            );
          }
        }

        if (replacePart) {
          if (replacePart.part) {
            newPartInfoMap[replacePart.part.id] = replacePart.part;
          } else if (replacePart.partId) {
            fetchPromises.push(
              getPartById(replacePart.partId)
                .then((response) => {
                  const partData = response?.data?.data || response?.data || response;
                  if (partData) {
                    newPartInfoMap[replacePart.partId] = partData;
                  }
                })
                .catch((error) => {
                  console.error("Error fetching part info for replacePart:", error);
                })
            );
          }
        }
      });

      if (Object.keys(newPartInfoMap).length > 0) {
        setPartInfoMap((prevMap) => ({ ...prevMap, ...newPartInfoMap }));
      }

      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
        setPartInfoMap((prevMap) => ({ ...prevMap, ...newPartInfoMap }));
      }
    };

    fetchPartInfos();
  }, [rma?.rmaDetails]);

  useEffect(() => {
    if (!rma?.rmaDetails) return;
    
    rma.rmaDetails.forEach((detail) => {
      if (detail.status?.toUpperCase() === "APPROVED") {
        const detailId = detail.id;
        const evCheckDetail = detail.evCheckDetail;
        const partItem = evCheckDetail?.partItem;
        const partItemPartId = partItem?.part?.id || partItem?.partId;
        const currentReplacePartId = detailForms[detailId]?.replacePartId || detail.replacePart?.partId;
        const isDetailSaved = savedDetails.has(detailId);
        
        if (partItemPartId && !currentReplacePartId && !isDetailSaved) {
          setDetailForms(prev => {
            if (prev[detailId]?.replacePartId) return prev;
            return {
              ...prev,
              [detailId]: {
                ...prev[detailId],
                replacePartId: partItemPartId
              }
            };
          });
        }
      }
    });
  }, [rma?.rmaDetails, savedDetails]);

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
      case "IN_STOCK":
        return "Còn trong kho";
      case "INSTALLED":
        return "Đã lắp đặt";
      case "MANUFACTURER_RECALL":
        return "Nhà sản xuất thu hồi";
      case "PENDING":
        return "Chờ xác nhận";
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
      case "APPOINTMENT_BOOKED":
        return "Đã đặt lịch";
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
      case "WARRANTY":
        return "Bảo hành";
      case "REFUND":
        return "Hoàn tiền";
      default:
        return remedies;
    }
  };

  const translateSolution = (solution) => {
    if (!solution || solution === "—") return "—";
    const solutionUpper = solution.toUpperCase();
    switch (solutionUpper) {
      case "REPLACE":
      case "WARRANTY":
        return "Bảo hành ";
      case "REPAIR":
        return "Sửa chữa";
      default:
        return solution;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1 text-lg px-4 py-2">
            Chờ xác nhận
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1 text-lg px-4 py-2">
            Đang xử lý
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 flex items-center gap-1 text-lg px-4 py-2">
            Đã duyệt
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 text-lg px-4 py-2">
            Đã từ chối
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 flex items-center gap-1 text-lg px-4 py-2">
            Đã hủy
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 text-lg px-4 py-2">
            Hoàn thành
          </Badge>
        );
      case "APPOINTMENT_BOOKED":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1 text-lg px-4 py-2">
            Đã đặt lịch
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

  const formatDateTime = (value) => safeFormat(value, "dd/MM/yyyy");
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
  const staffPhone = rma.staff?.phone;
  const staffEmail = rma.staff?.email;

  const totalSerials = rma.rmaDetails?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0;
  const partCount = rma.rmaDetails?.length || 0;
  
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
      phone:
        rma.customer?.phone ||
        rma.customer?.account?.phone ||
        rma.customerPhone ||
        rma.appointment?.phone ||
        rma.appointment?.customer?.account?.phone ||
        "",
      email:
        rma.customer?.email ||
        rma.customer?.account?.email ||
        rma.customerEmail ||
        rma.appointment?.customer?.account?.email ||
        "",
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
      toastify.error("Không có chi tiết RMA nào để duyệt");
      return;
    }

    setIsProcessing(true);
    try {
      const pendingDetails = rma.rmaDetails.filter((detail) => 
        detail.status?.toUpperCase() === "PENDING"
      );

      if (pendingDetails.length === 0) {
        toastify.info("Không có chi tiết RMA nào đang chờ duyệt");
        setIsConfirmDialogOpen(false);
        setIsProcessing(false);
        return;
      }

      const updatePromises = pendingDetails.map((detail) =>
        updateRmaDetail(detail.id, { 
          status: "APPROVED",
        })
      );

      await Promise.all(updatePromises);

      await fetchRmaDetail();

      toastify.success(`Đã duyệt ${pendingDetails.length} chi tiết RMA`);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error approving RMA details:", error);
      toastify.error(error?.response?.data?.message || "Không thể duyệt chi tiết RMA");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveDetail = async (detailId, detail) => {
    if (!detailId || !detail) return;
    
    const formData = detailForms[detailId] || {};
    const releaseDateRMA = formData.releaseDateRMA || detail.releaseDateRMA || null;
    const expirationDateRMA = formData.expirationDateRMA || detail.expirationDateRMA || null;
    
    setIsProcessing(true);
    setUpdatingDetailId(detailId);
    try {
      await updateRmaDetail(detailId, { 
        status: "APPROVED",
        releaseDateRMA: releaseDateRMA,
        expirationDateRMA: expirationDateRMA,
      });

      await fetchRmaDetail();

      toastify.success("Đã xác nhận RMA thành công");
    } catch (error) {
      console.error("Error approving RMA detail:", error);
      toastify.error(error?.response?.data?.message || "Không thể xác nhận RMA");
    } finally {
      setIsProcessing(false);
      setUpdatingDetailId(null);
    }
  };

  const handleFormChange = (detailId, field, value) => {
    setDetailForms(prev => {
      const currentForm = prev[detailId] || {};
      const detail = rma?.rmaDetails?.find(d => d.id === detailId);
      const updatedForm = {
        ...currentForm,
        [field]: value,
      };

      if (field === "releaseDateRMA" && value && !currentForm.replacePartWarrantyStart) {
        updatedForm.replacePartWarrantyStart = value;
      }

      if (field === "releaseDateRMA" && value) {
        const releaseDate = new Date(value);
        const expirationDate = new Date(releaseDate);
        expirationDate.setDate(expirationDate.getDate() + 7);
        const newExpirationDateISO = toUtcDateISOString(expirationDate);
        
        const currentExpirationInForm = currentForm.expirationDateRMA;
        const oldReleaseDate = detail?.releaseDateRMA || currentForm.releaseDateRMA;
        
        if (!currentExpirationInForm) {
          updatedForm.expirationDateRMA = newExpirationDateISO;
        } else if (oldReleaseDate) {
          const oldRelease = new Date(oldReleaseDate);
          const expectedOldExpiration = new Date(oldRelease);
          expectedOldExpiration.setDate(expectedOldExpiration.getDate() + 7);
          const currentExp = new Date(currentExpirationInForm);
          
          const currentExpDate = new Date(currentExp.getFullYear(), currentExp.getMonth(), currentExp.getDate());
          const expectedDate = new Date(expectedOldExpiration.getFullYear(), expectedOldExpiration.getMonth(), expectedOldExpiration.getDate());
          
          if (currentExpDate.getTime() === expectedDate.getTime()) {
            updatedForm.expirationDateRMA = newExpirationDateISO;
          }
        } else {
          updatedForm.expirationDateRMA = newExpirationDateISO;
        }
      } else if (field === "releaseDateRMA" && !value) {
        const currentExpirationInForm = currentForm.expirationDateRMA;
        const oldReleaseDate = (detail || rma?.rmaDetails?.find(d => d.id === detailId))?.releaseDateRMA || currentForm.releaseDateRMA;
        
        if (!currentExpirationInForm) {
          updatedForm.expirationDateRMA = null;
        } else if (oldReleaseDate) {
          const oldRelease = new Date(oldReleaseDate);
          const expectedOldExpiration = new Date(oldRelease);
          expectedOldExpiration.setDate(expectedOldExpiration.getDate() + 7);
          const currentExp = new Date(currentExpirationInForm);
          
          const currentExpDate = new Date(currentExp.getFullYear(), currentExp.getMonth(), currentExp.getDate());
          const expectedDate = new Date(expectedOldExpiration.getFullYear(), expectedOldExpiration.getMonth(), expectedOldExpiration.getDate());
          
          if (currentExpDate.getTime() === expectedDate.getTime()) {
            updatedForm.expirationDateRMA = null;
          }
        }
      }

      if (field === "replacePartWarrantyPeriod" || field === "replacePartWarrantyStart" || field === "releaseDateRMA") {
        const warrantyPeriod = updatedForm.replacePartWarrantyPeriod || currentForm.replacePartWarrantyPeriod || 0;
        const warrantyStart = updatedForm.replacePartWarrantyStart || currentForm.replacePartWarrantyStart || (field === "releaseDateRMA" ? value : null);
        
        if (warrantyStart && warrantyPeriod && warrantyPeriod > 0) {
          const startDate = new Date(warrantyStart);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + parseInt(warrantyPeriod));
          updatedForm.replacePartWarrantyEnd = toUtcDateISOString(endDate);
        } else {
          updatedForm.replacePartWarrantyEnd = null;
        }
      }

      return {
        ...prev,
        [detailId]: updatedForm,
      };
    });
  };

  const handleSubmitHangInfo = async (detailId, detail) => {
    if (!detailId || !detail) return;
    
    const formData = detailForms[detailId] || {};
    
    setIsProcessing(true);
    setUpdatingDetailId(detailId);
    try {
      const releaseDate = formData.releaseDateRMA || detail.releaseDateRMA || toUtcDateISOString(new Date());
      const warrantyStartDate = formData.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || releaseDate;
      
      let warrantyEndDate = null;
      const warrantyPeriod = formData.replacePartWarrantyPeriod || detail.replacePart?.warrantyPeriod || 0;
      if (warrantyStartDate && warrantyPeriod > 0) {
        const startDate = new Date(warrantyStartDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(warrantyPeriod));
        warrantyEndDate = toUtcDateISOString(endDate);
      } else {
        warrantyEndDate = formData.replacePartWarrantyEnd || detail.replacePart?.warantyEndDate || null;
      }

      const expirationDateRMA = formData.expirationDateRMA || detail.expirationDateRMA || null;
      const releaseDateRMA = formData.releaseDateRMA || detail.releaseDateRMA || null;

      const payload = {
        status: "APPROVED", 
        quantity: detail.quantity,
        reason: detail.reason,
        rmaNumber: formData.rmaNumber || detail.rmaNumber || "",
        releaseDateRMA: releaseDateRMA,
        expirationDateRMA: expirationDateRMA,
        inspector: formData.inspector || detail.inspector || "",
        result: formData.result || detail.result || "",
        solution: formData.solution || detail.solution || "",
        evCheckDetailId: detail.evCheckDetailId || detail.evCheckDetail?.id,
        rmaId: detail.rmaId || rma?.id,
        isManufacturerWarranty: true,
      };

      if (formData.replacePartId || detail.replacePart?.partId) {
        payload.replacePart = {
          partId: formData.replacePartId || detail.replacePart?.partId || null,
          exportNoteId: null,
          importNoteId: null,
          quantity: 1,
          serialNumber: formData.replacePartSerial || detail.replacePart?.serialNumber || "",
          price: formData.replacePartPrice ? parseFloat(formData.replacePartPrice) : (detail.replacePart?.price || 0),
          warrantyPeriod: warrantyPeriod,
          warantyStartDate: warrantyStartDate,
          warantyEndDate: warrantyEndDate,
          serviceCenterInventoryId: null,
          isManufacturerWarranty: true,
        };
      }

      await updateRmaDetail(detailId, payload);
      await fetchRmaDetail();
      setSavedDetails(prev => new Set([...prev, detailId]));

      toastify.success("Đã cập nhật thông tin hãng thành công");
    } catch (error) {
      console.error("Error updating hang info:", error);
      toastify.error(error?.response?.data?.message || "Không thể cập nhật thông tin hãng");
    } finally {
      setIsProcessing(false);
      setUpdatingDetailId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toastify.error("Vui lòng nhập lý do từ chối");
      return;
    }

    if (!rma?.rmaDetails || rma.rmaDetails.length === 0) {
      toastify.error("Không có chi tiết RMA nào để từ chối");
      return;
    }

    setIsProcessing(true);
    try {
      const pendingDetails = rma.rmaDetails.filter((detail) => 
        detail.status?.toUpperCase() === "PENDING"
      );

      if (pendingDetails.length === 0) {
        toastify.info("Không có chi tiết RMA nào đang chờ duyệt");
        setIsRejectDialogOpen(false);
        setRejectionReason("");
        setIsProcessing(false);
        return;
      }

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

      await fetchRmaDetail();

      toastify.success(`Đã từ chối ${pendingDetails.length} chi tiết RMA`);
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting RMA details:", error);
      toastify.error(error?.response?.data?.message || "Không thể từ chối chi tiết RMA");
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      <div className="px-4 py-6 sm:px-6 lg:px-8 w-full">
        <Button variant="ghost" onClick={() => navigate("/manager/warranty")} className="mb-6 hover:bg-muted/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", statusInfo.gradient)} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex-1 space-y-6">
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
              {rma?.rmaDetails && rma.rmaDetails.some((detail) => detail.status?.toUpperCase() === "PENDING") && (
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Button
                    onClick={() => setIsConfirmDialogOpen(true)}
                    disabled={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md backdrop-blur-sm border-2 border-white/80"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Duyệt tất cả
                  </Button>
                  <Button
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isProcessing}
                    variant="destructive"
                    className="shadow-md backdrop-blur-sm border-2 border-white/80"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Từ chối tất cả
                  </Button>
                </div>
              )}
            </div>
            <div className="grid w-full md:w-auto md:min-w-[300px] grid-cols-2 gap-4">
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

        <div className="w-full">
          <div className="space-y-6">
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
                            
                            const remedies = evCheckDetail?.remedies || "—";
                            const unit = evCheckDetail?.unit || "—";
                            const evQuantity = evCheckDetail?.quantity || 0;
                            const pricePart = evCheckDetail?.pricePart || 0;
                            const priceService = evCheckDetail?.priceService || 0;
                            const totalAmount = evCheckDetail?.totalAmount || 0;
                            const evStatus = evCheckDetail?.status || "—";
                            
                            const partItemSerial = partItem?.serialNumber || "—";
                            const partItemPrice = formatCurrency(partItem?.price);
                            const partItemWarrantyStart = formatDateOnly(partItem?.warrantyStartDate);
                            const partItemWarrantyEnd = formatDateOnly(partItem?.warrantyEndDate);
                            const partItemStatus = partItem?.status || "—";
                            const partItemPart = partItem?.part || (partItem?.partId ? partInfoMap[partItem.partId] : null);
                            const partItemName = partItemPart?.name || "—";
                            const partItemImage = partItemPart?.image || "";
                            
                            const replacePartSerial = replacePart?.serialNumber || "—";
                            const replacePartPrice = formatCurrency(replacePart?.price);
                            const replacePartWarrantyStart = formatDateOnly(replacePart?.warantyStartDate);
                            const replacePartWarrantyEnd = formatDateOnly(replacePart?.warantyEndDate);
                            const replacePartStatus = replacePart?.status || "—";
                            const replacePartPart = replacePart?.part || (replacePart?.partId ? partInfoMap[replacePart.partId] : null);
                            const replacePartName = replacePartPart?.name || "—";
                            const replacePartImage = replacePartPart?.image || "";
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
                            const isSaved = savedDetails.has(detailId);
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
                                
                                {isExpanded && (
                                  <div className="p-6 space-y-6">
                                    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                                      <div className="bg-primary/5 border-b border-primary/20 px-5 py-3">
                                        <div className="flex items-center gap-2">
                                          <h3 className="text-base font-semibold tracking-tight text-primary">
                                            Thông tin RMA
                                          </h3>
                                        </div>
                                      </div>
                                      <div className="grid gap-5 px-5 py-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do</p>
                                          </div>
                                          <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                                            {reason}
                                          </p>
                                        </div>
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                              Ngày phát hành
                                            </p>
                                          </div>
                                          <p className="text-sm md:text-base font-semibold text-foreground">{releaseDate}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                              Ngày hết hạn
                                            </p>
                                          </div>
                                          <p className="text-sm md:text-base font-semibold text-foreground">{expirationDate}</p>
                                        </div>
                                        {((result && result !== "—") || (solution && solution !== "—")) && (
                                          <div className="md:col-span-3 pt-4 mt-2 border-t border-dashed border-border/70">
                                            <div className="grid gap-4 md:grid-cols-2">
                                              {(result && result !== "—") && (
                                                <div className="space-y-1.5">
                                                  <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                      Kết quả
                                                    </p>
                                                  </div>
                                                  <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                                                    {result}
                                                  </p>
                                                </div>
                                              )}
                                              {(solution && solution !== "—") && (
                                                <div className="space-y-1.5">
                                                  <div className="flex items-center gap-2">
                                                    <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                      Giải pháp
                                                    </p>
                                                  </div>
                                                  <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
                                                    {translateSolution(solution)}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {detailStatus?.toUpperCase() === "PENDING" && (
                                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 shadow-sm overflow-hidden">
                                        <div className="bg-amber-600/5 border-b border-amber-200/80 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-amber-600" />
                                            <h3 className="text-base font-semibold tracking-tight text-amber-800">
                                              Nhập ngày RMA
                                            </h3>
                                          </div>
                                        </div>
                                        <div className="p-5 space-y-5">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                              <Label
                                                htmlFor={`pending-releaseDate-${detailId}`}
                                                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                              >
                                                Ngày phát hành RMA
                                              </Label>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={cn(
                                                      "w-full justify-start text-left font-normal",
                                                      !(detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA) && "text-muted-foreground"
                                                    )}
                                                  >
                                                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA ? (
                                                      format(new Date(detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA), "dd/MM/yyyy")
                                                    ) : (
                                                      <span>Chọn ngày phát hành</span>
                                                    )}
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <div className="p-3 border-b flex items-center gap-2">
                                                    <Select
                                                      value={getDatePickerMonth(detailId, "releaseDateRMA", detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA).getFullYear().toString()}
                                                      onValueChange={(year) => {
                                                        const currentMonth = getDatePickerMonth(detailId, "releaseDateRMA", detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA);
                                                        const newDate = new Date(currentMonth);
                                                        newDate.setFullYear(parseInt(year));
                                                        setDatePickerMonth(detailId, "releaseDateRMA", newDate);
                                                      }}
                                                    >
                                                      <SelectTrigger className="w-[100px] h-8">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {generateYears().map((year) => (
                                                          <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8"
                                                      onClick={() => setDatePickerMonth(detailId, "releaseDateRMA", new Date())}
                                                    >
                                                      Năm nay
                                                    </Button>
                                                  </div>
                                                  <CalendarComponent
                                                    mode="single"
                                                    selected={
                                                      detailForms[detailId]?.releaseDateRMA 
                                                        ? new Date(detailForms[detailId].releaseDateRMA)
                                                        : detail.releaseDateRMA 
                                                          ? new Date(detail.releaseDateRMA)
                                                          : undefined
                                                    }
                                                    onSelect={(date) => {
                                                      const dateISO = toUtcDateISOString(date);
                                                      handleFormChange(detailId, "releaseDateRMA", dateISO);
                                                    }}
                                                    month={getDatePickerMonth(detailId, "releaseDateRMA", detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA)}
                                                    onMonthChange={(month) => setDatePickerMonth(detailId, "releaseDateRMA", month)}
                                                    disabled={(date) => {
                                                      const today = new Date();
                                                      today.setHours(0, 0, 0, 0);
                                                      return date < today;
                                                    }}
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label
                                                htmlFor={`pending-expirationDate-${detailId}`}
                                                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                              >
                                                Ngày hết hạn RMA
                                              </Label>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={cn(
                                                      "w-full justify-start text-left font-normal",
                                                      !(detailForms[detailId]?.expirationDateRMA || detail.expirationDateRMA) && "text-muted-foreground"
                                                    )}
                                                  >
                                                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {detailForms[detailId]?.expirationDateRMA || detail.expirationDateRMA ? (
                                                      format(new Date(detailForms[detailId]?.expirationDateRMA || detail.expirationDateRMA), "dd/MM/yyyy")
                                                    ) : (
                                                      <span>Chọn ngày hết hạn</span>
                                                    )}
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <div className="p-3 border-b flex items-center gap-2">
                                                    <Select
                                                      value={getDatePickerMonth(detailId, "expirationDateRMA", detailForms[detailId]?.expirationDateRMA || detail.expirationDateRMA || new Date()).getFullYear().toString()}
                                                      onValueChange={(year) => {
                                                        const currentMonth = getDatePickerMonth(detailId, "expirationDateRMA", detailForms[detailId]?.expirationDateRMA || detail.expirationDateRMA || new Date());
                                                        const newDate = new Date(currentMonth);
                                                        newDate.setFullYear(parseInt(year));
                                                        setDatePickerMonth(detailId, "expirationDateRMA", newDate);
                                                      }}
                                                    >
                                                      <SelectTrigger className="w-[100px] h-8">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {generateYears().map((year) => (
                                                          <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8"
                                                      onClick={() => setDatePickerMonth(detailId, "expirationDateRMA", new Date())}
                                                    >
                                                      Năm nay
                                                    </Button>
                                                  </div>
                                                  <CalendarComponent
                                                    mode="single"
                                                    selected={
                                                      detailForms[detailId]?.expirationDateRMA 
                                                        ? new Date(detailForms[detailId].expirationDateRMA)
                                                        : detail.expirationDateRMA 
                                                          ? new Date(detail.expirationDateRMA)
                                                          : undefined
                                                    }
                                                    onSelect={(date) => {
                                                      const dateISO = toUtcDateISOString(date);
                                                      handleFormChange(detailId, "expirationDateRMA", dateISO);
                                                    }}
                                                    month={getDatePickerMonth(detailId, "expirationDateRMA", detailForms[detailId]?.expirationDateRMA || detail.expirationDateRMA || new Date())}
                                                    onMonthChange={(month) => setDatePickerMonth(detailId, "expirationDateRMA", month)}
                                                    disabled={(date) => {
                                                      const today = new Date();
                                                      today.setHours(0, 0, 0, 0);
                                                      return date < today;
                                                    }}
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {detailStatus?.toUpperCase() === "APPROVED" && (
                                      <div className="rounded-xl border border-red-200/80 bg-red-50/70 shadow-sm overflow-hidden">
                                        <div className="bg-red-600/5 border-b border-red-200/80 px-5 py-3">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-red-500" />
                                            <h3 className="text-base font-semibold tracking-tight text-red-800">
                                              Phản hồi của hãng
                                            </h3>
                                          </div>
                                        </div>
                                        <div className="p-5 space-y-5">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                              <Label
                                                htmlFor={`rmaNumber-${detailId}`}
                                                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                              >
                                                Số RMA
                                              </Label>
                                              <Input
                                                id={`rmaNumber-${detailId}`}
                                                value={detailForms[detailId]?.rmaNumber || detail.rmaNumber || ""}
                                                onChange={(e) => handleFormChange(detailId, "rmaNumber", e.target.value)}
                                                placeholder="Nhập số RMA"
                                                disabled={isSaved}
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label
                                                htmlFor={`inspector-${detailId}`}
                                                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                              >
                                                Người kiểm tra
                                              </Label>
                                              <Input
                                                id={`inspector-${detailId}`}
                                                value={detailForms[detailId]?.inspector || detail.inspector || ""}
                                                onChange={(e) => handleFormChange(detailId, "inspector", e.target.value)}
                                                placeholder="Nhập tên người kiểm tra"
                                                disabled={isSaved}
                                              />
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-1.5">
                                            <Label
                                              htmlFor={`result-${detailId}`}
                                              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                            >
                                              Kết quả kiểm tra
                                            </Label>
                                            <Textarea
                                              id={`result-${detailId}`}
                                              value={detailForms[detailId]?.result || detail.result || ""}
                                              onChange={(e) => handleFormChange(detailId, "result", e.target.value)}
                                              placeholder="Nhập kết quả kiểm tra từ hãng"
                                              rows={3}
                                              className="resize-none"
                                              disabled={isSaved}
                                            />
                                          </div>

                                          <div className="space-y-1.5">
                                            <Label
                                              htmlFor={`solution-${detailId}`}
                                              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                            >
                                              Giải pháp
                                            </Label>
                                            <Select
                                              value={
                                                (() => {
                                                  const formValue = detailForms[detailId]?.solution;
                                                  if (formValue !== undefined) return formValue;
                                                  
                                                  const detailSolution = detail.solution || "";
                                                  if (detailSolution === "WARRANTY" || detailSolution === "REPLACE") return "REPLACE";
                                                  if (detailSolution === "REPAIR") return "REPAIR";
                                                  return "";
                                                })()
                                              }
                                              onValueChange={(value) => handleFormChange(detailId, "solution", value)}
                                              disabled={isSaved}
                                            >
                                              <SelectTrigger id={`solution-${detailId}`}>
                                                <SelectValue placeholder="Chọn giải pháp" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="REPLACE">Thay thế</SelectItem>
                                                <SelectItem value="REPAIR">Sửa chữa</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {(() => {
                                            const currentSolution = detailForms[detailId]?.solution !== undefined 
                                              ? detailForms[detailId].solution 
                                              : detail.solution || "";
                                            const solutionValue = currentSolution === "WARRANTY" || currentSolution === "REPLACE" ? "REPLACE" : currentSolution;
                                            
                                            // Chỉ hiển thị phần phụ tùng thay thế khi giải pháp không phải là "REPAIR" (Sửa chữa)
                                            if (solutionValue === "REPAIR") {
                                              return null;
                                            }
                                            
                                            return (
                                          <div className="rounded-xl border border-red-200/80 bg-red-50/70 shadow-sm overflow-hidden mt-4">
                                            <div className="bg-red-600/5 border-b border-red-200/80 px-5 py-3">
                                              <div className="flex items-center gap-2">
                                                <Package className="h-5 w-5 text-red-500" />
                                                <h3 className="text-base font-semibold tracking-tight text-red-800">
                                                  Bộ phận thay thế (Tùy chọn)
                                                </h3>
                                              </div>
                                            </div>
                                            <div className="p-5 space-y-5">
                                              {(() => {
                                                const selectedPartId = detailForms[detailId]?.replacePartId || detail.replacePart?.partId;
                                                const selectedPart = parts.find(part => part.id === selectedPartId);
                                                const replacePartPart = detail.replacePart?.part || selectedPart || partItem?.part || (selectedPartId ? partInfoMap[selectedPartId] : null);
                                                
                                                const shouldShow = selectedPartId || (partItem?.part && !selectedPartId);
                                                const displayPart = selectedPartId ? replacePartPart : partItem?.part;
                                                const displayName = displayPart?.name || "";
                                                const displayImage = displayPart?.image || "";
                                                
                                                if (shouldShow && (displayName || displayImage)) {
                                                  return (
                                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-200/60 shadow-sm">
                                                      {displayImage && (
                                                        <div className="flex-shrink-0">
                                                          <img
                                                            src={displayImage}
                                                            alt={displayName}
                                                            className="h-20 w-20 rounded-lg object-cover border-2 border-red-300/40 shadow-md"
                                                            onError={(e) => {
                                                              e.target.style.display = "none";
                                                            }}
                                                          />
                                                        </div>
                                                      )}
                                                      {displayName && (
                                                        <div className="flex-1 min-w-0 pt-1">
                                                          <p className="text-xs font-bold uppercase tracking-wider text-red-700/70 mb-2">
                                                            {selectedPartId ? "PHỤ TÙNG ĐÃ CHỌN" : "PHỤ TÙNG GỐC"}
                                                          </p>
                                                          <p className="text-base font-bold text-foreground break-words leading-tight">{displayName}</p>
                                                          {displayPart?.code && (
                                                            <p className="text-sm text-muted-foreground mt-1">Mã: {displayPart.code}</p>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              })()}
                                              
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                  <Label
                                                    htmlFor={`replacePartId-${detailId}`}
                                                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                                  >
                                                    Phụ tùng
                                                  </Label>
                                                  {(() => {
                                                    const autoPartId = partItem?.part?.id || partItem?.partId;
                                                    const selectedPartId = detailForms[detailId]?.replacePartId || detail.replacePart?.partId || autoPartId;
                                                    const selectedPart = parts.find(part => part.id === selectedPartId) || partItem?.part;
                                                    const partName = selectedPart?.name || partItemPart?.name || "—";
                                                    
                                                    return (
                                                      <Input
                                                        id={`replacePartId-${detailId}`}
                                                        value={partName}
                                                        readOnly
                                                        className="bg-muted cursor-not-allowed"
                                                        placeholder="Tự động từ phụ tùng gốc"
                                                        disabled={isSaved}
                                                      />
                                                    );
                                                  })()}
                                                </div>
                                                <div className="space-y-1.5">
                                                  <Label
                                                    htmlFor={`replacePartSerial-${detailId}`}
                                                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                                  >
                                                    Số serial
                                                  </Label>
                                                  <Input
                                                    id={`replacePartSerial-${detailId}`}
                                                    value={detailForms[detailId]?.replacePartSerial || detail.replacePart?.serialNumber || ""}
                                                    onChange={(e) => handleFormChange(detailId, "replacePartSerial", e.target.value)}
                                                    placeholder="Nhập số serial (VD: PIN-2025-L01-000123)"
                                                    disabled={isSaved}
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <Label
                                                    htmlFor={`replacePartWarrantyPeriod-${detailId}`}
                                                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                                  >
                                                    Thời hạn bảo hành (tháng)
                                                  </Label>
                                                  <Input
                                                    id={`replacePartWarrantyPeriod-${detailId}`}
                                                    type="number"
                                                    min="0"
                                                    value={detailForms[detailId]?.replacePartWarrantyPeriod || detail.replacePart?.warrantyPeriod || ""}
                                                    onChange={(e) => handleFormChange(detailId, "replacePartWarrantyPeriod", e.target.value ? parseInt(e.target.value) : 0)}
                                                    placeholder="Nhập số tháng (VD: 12)"
                                                    disabled={isSaved}
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <Label
                                                    htmlFor={`replacePartWarrantyStart-${detailId}`}
                                                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                                  >
                                                    Ngày bắt đầu BH
                                                  </Label>
                                                  <Popover>
                                                    <PopoverTrigger asChild>
                                                      <Button
                                                        variant="outline"
                                                        className={cn(
                                                          "w-full justify-start text-left font-normal",
                                                          !(detailForms[detailId]?.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA) && "text-muted-foreground"
                                                        )}
                                                        disabled={isSaved}
                                                      >
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {detailForms[detailId]?.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA ? (
                                                          format(new Date(detailForms[detailId]?.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA), "dd/MM/yyyy")
                                                        ) : (
                                                          <span>dd/mm/yyyy</span>
                                                        )}
                                                      </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                      <div className="p-3 border-b flex items-center gap-2">
                                                        <Select
                                                          value={getDatePickerMonth(detailId, "replacePartWarrantyStart", detailForms[detailId]?.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA).getFullYear().toString()}
                                                          onValueChange={(year) => {
                                                            const currentMonth = getDatePickerMonth(detailId, "replacePartWarrantyStart", detailForms[detailId]?.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA);
                                                            const newDate = new Date(currentMonth);
                                                            newDate.setFullYear(parseInt(year));
                                                            setDatePickerMonth(detailId, "replacePartWarrantyStart", newDate);
                                                          }}
                                                        >
                                                          <SelectTrigger className="w-[100px] h-8">
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            {generateYears().map((year) => (
                                                              <SelectItem key={year} value={year.toString()}>
                                                                {year}
                                                              </SelectItem>
                                                            ))}
                                                          </SelectContent>
                                                        </Select>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-8"
                                                          onClick={() => setDatePickerMonth(detailId, "replacePartWarrantyStart", new Date())}
                                                        >
                                                          Năm nay
                                                        </Button>
                                                      </div>
                                                      <CalendarComponent
                                                        mode="single"
                                                        selected={
                                                          detailForms[detailId]?.replacePartWarrantyStart 
                                                            ? new Date(detailForms[detailId].replacePartWarrantyStart)
                                                            : detail.replacePart?.warantyStartDate 
                                                              ? new Date(detail.replacePart.warantyStartDate)
                                                              : detailForms[detailId]?.releaseDateRMA
                                                                ? new Date(detailForms[detailId].releaseDateRMA)
                                                                : detail.releaseDateRMA
                                                                  ? new Date(detail.releaseDateRMA)
                                                                  : undefined
                                                        }
                                                        onSelect={(date) => {
                                                          const dateISO = toUtcDateISOString(date);
                                                          handleFormChange(detailId, "replacePartWarrantyStart", dateISO);
                                                        }}
                                                        month={getDatePickerMonth(detailId, "replacePartWarrantyStart", detailForms[detailId]?.replacePartWarrantyStart || detail.replacePart?.warantyStartDate || detailForms[detailId]?.releaseDateRMA || detail.releaseDateRMA)}
                                                        onMonthChange={(month) => setDatePickerMonth(detailId, "replacePartWarrantyStart", month)}
                                                        disabled={(date) => {
                                                          const today = new Date();
                                                          today.setHours(0, 0, 0, 0);
                                                          return date < today;
                                                        }}
                                                        initialFocus
                                                      />
                                                    </PopoverContent>
                                                  </Popover>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label htmlFor={`replacePartWarrantyEnd-${detailId}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ngày kết thúc bảo hành</Label>
                                                  <Input
                                                    id={`replacePartWarrantyEnd-${detailId}`}
                                                    readOnly
                                                    value={
                                                      detailForms[detailId]?.replacePartWarrantyEnd || detail.replacePart?.warantyEndDate
                                                        ? format(new Date(detailForms[detailId]?.replacePartWarrantyEnd || detail.replacePart.warantyEndDate), "dd/MM/yyyy")
                                                        : ""
                                                    }
                                                    placeholder="Tự động tính từ ngày bắt đầu + số tháng"
                                                    className="bg-muted"
                                                    disabled={isSaved}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                            );
                                          })()}

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
                                              disabled={(isProcessing && updatingDetailId === detailId) || isSaved}
                                            >
                                              Hủy
                                            </Button>
                                            <Button
                                              onClick={() => handleSubmitHangInfo(detailId, detail)}
                                              disabled={isProcessing && updatingDetailId === detailId || savedDetails.has(detailId)}
                                              className={savedDetails.has(detailId) 
                                                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                                                : "bg-green-600 hover:bg-green-700"}
                                            >
                                              {isProcessing && updatingDetailId === detailId ? (
                                                <>
                                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                  Đang lưu...
                                                </>
                                              ) : savedDetails.has(detailId) ? (
                                                <>
                                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                                  Đã lưu thông tin
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

                                    {partItem && (
                                      <div className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-hidden">
                                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60 px-6 py-4">
                                          <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-bold text-foreground">Phụ tùng cần bảo hành</h3>
                                          </div>
                                        </div>
                                        <div className="px-6 py-5 space-y-5">
                                          {(partItemImage || partItemName !== "—") && (
                                            <div className="flex items-start gap-5 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/20 shadow-sm">
                                              {partItemImage && (
                                                <div className="flex-shrink-0">
                                                  <div className="relative">
                                                    <img
                                                      src={partItemImage}
                                                      alt={partItemName}
                                                      className="h-24 w-24 rounded-xl object-cover border-2 border-primary/30 shadow-md ring-2 ring-primary/10"
                                                      onError={(e) => {
                                                        e.target.style.display = "none";
                                                      }}
                                                    />
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                                  </div>
                                                </div>
                                              )}
                                              {partItemName !== "—" && (
                                                <div className="flex-1 min-w-0 pt-1">
                                                  <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-2">TÊN PHỤ TÙNG</p>
                                                  <p className="text-lg font-bold text-foreground break-words leading-tight">{partItemName}</p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            {(partItemSerial && partItemSerial !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Hash className="h-4 w-4 text-primary" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"># Số serial</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground break-all font-mono">{partItemSerial}</p>
                                              </div>
                                            )}
                                            {(partItemWarrantyStart && partItemWarrantyStart !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Calendar className="h-4 w-4 text-primary" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BH từ</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground">{partItemWarrantyStart}</p>
                                              </div>
                                            )}
                                            {(partItemWarrantyEnd && partItemWarrantyEnd !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Calendar className="h-4 w-4 text-primary" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BH đến</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground">{partItemWarrantyEnd}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {replacePart && (
                                      <div className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-hidden">
                                        <div className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border-b border-border/60 px-6 py-4">
                                          <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-green-600" />
                                            <h3 className="text-lg font-bold text-foreground">Phụ tùng thay thế</h3>
                                          </div>
                                        </div>
                                        <div className="px-6 py-5 space-y-5">
                                          {(replacePartImage || replacePartName !== "—") && (
                                            <div className="flex items-start gap-5 p-4 rounded-xl bg-gradient-to-br from-green-500/5 via-green-500/3 to-transparent border border-green-500/20 shadow-sm">
                                              {replacePartImage && (
                                                <div className="flex-shrink-0">
                                                  <div className="relative">
                                                    <img
                                                      src={replacePartImage}
                                                      alt={replacePartName}
                                                      className="h-24 w-24 rounded-xl object-cover border-2 border-green-500/30 shadow-md ring-2 ring-green-500/10"
                                                      onError={(e) => {
                                                        e.target.style.display = "none";
                                                      }}
                                                    />
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                                  </div>
                                                </div>
                                              )}
                                              {replacePartName !== "—" && (
                                                <div className="flex-1 min-w-0 pt-1">
                                                  <p className="text-xs font-bold uppercase tracking-wider text-green-600/70 mb-2">TÊN PHỤ TÙNG</p>
                                                  <p className="text-lg font-bold text-foreground break-words leading-tight">{replacePartName}</p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            {(replacePartSerial && replacePartSerial !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Hash className="h-4 w-4 text-green-600" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"># Số serial</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground break-all font-mono">{replacePartSerial}</p>
                                              </div>
                                            )}
                                            {(replacePartPrice && replacePartPrice !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Hash className="h-4 w-4 text-green-600" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"># Giá</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground">{replacePartPrice}</p>
                                              </div>
                                            )}
                                            {(replacePartWarrantyStart && replacePartWarrantyStart !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Calendar className="h-4 w-4 text-green-600" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BH từ</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground">{replacePartWarrantyStart}</p>
                                              </div>
                                            )}
                                            {(replacePartWarrantyEnd && replacePartWarrantyEnd !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Calendar className="h-4 w-4 text-green-600" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BH đến</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground">{replacePartWarrantyEnd}</p>
                                              </div>
                                            )}
                                            {(replacePartStatus && replacePartStatus !== "—") && (
                                              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                                                </div>
                                                <p className="text-base font-bold text-foreground">{translateStatus(replacePartStatus)}</p>
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



