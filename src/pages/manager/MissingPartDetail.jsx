import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Tag,
  Package,
  Check,
  Building2,
  User,
  DollarSign,
  Calendar,
  Search,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getExportNoteOutOfStockById } from "@/api/exportNotesApi";
import { getServiceCenterInventories } from "@/api/serviceCenterInventoriesApi";

const statusClassMap = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  EXPORTING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
  OUT_OF_STOCK: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
};

const statusLabelMap = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  EXPORTING: "Đang xuất",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  OUT_OF_STOCK: "Hết hàng",
};

const getStatusBadgeClass = (status) => statusClassMap[status] || "bg-muted text-muted-foreground border-border";
const getStatusLabel = (status) => statusLabelMap[status] || status || "—";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const getTypeLabel = (type) => {
  const map = {
    REPLACEMENT: "Thay thế",
    TRANSFER_TO: "Chuyển kho",
  };
  return map[type] || type || "—";
};

export default function MissingPartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exportNote, setExportNote] = useState(null);
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [availabilityData, setAvailabilityData] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState({});
  const [expandedBranches, setExpandedBranches] = useState({});

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await getExportNoteOutOfStockById(id);
        if (response.success && response.data) {
          setExportNote(response.data);
        } else {
          throw new Error(response.message || "Không thể tải chi tiết phiếu.");
        }
      } catch (error) {
        console.error("Error fetching missing part detail:", error);
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải chi tiết phiếu.",
          variant: "destructive",
        });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id, toast, navigate]);

  const proposedParts = useMemo(() => {
    if (!exportNote?.exportNoteDetails) return [];
    return exportNote.exportNoteDetails
      .map((detail) => ({
        id: detail.id,
        code: detail.proposedReplacePart?.code || "—",
        name: detail.proposedReplacePart?.name || "—",
        description: detail.proposedReplacePart?.description || "—",
        quantity: detail.quantity || 0,
        status: detail.status || "OUT_OF_STOCK",
        partId: detail.proposedReplacePartId || detail.proposedReplacePart?.id,
      }))
      .filter((item) => item.code !== "—" || item.name !== "—");
  }, [exportNote]);

  const handleSearchAvailability = async (part) => {
    if (!part?.partId && !part?.code) {
      toast({
        title: "Thông báo",
        description: "Không tìm thấy mã phụ tùng để tra cứu.",
      });
      return;
    }

    setExpandedPartId((prev) => (prev === part.id ? null : part.id));

    if (availabilityData[part.id]) {
      return;
    }

    try {
      setAvailabilityLoading((prev) => ({ ...prev, [part.id]: true }));
      const response = await getServiceCenterInventories({
        page: 1,
        pageSize: 100,
        search: part.code,
      });

      const inventories = response?.data?.rowDatas || [];
      const targetCode = (part.code || "").toLowerCase();

      const branches = inventories.reduce((acc, inventory) => {
        const serviceCenter = inventory.serviceCenter || {};
        const matchedItems = (inventory.partItems || []).filter(
          (item) => (item?.part?.code || "").toLowerCase() === targetCode
        );

        if (!matchedItems.length) return acc;

        const keeper = serviceCenter.staffs?.find((staff) => staff.position === "STORE_KEEPER");

        acc.push({
          inventoryId: inventory.id,
          serviceCenterName: serviceCenter.name || serviceCenter.code || "—",
          address: serviceCenter.address || "—",
          phone: serviceCenter.phone || "—",
          keeper: keeper
            ? `${keeper.firstName || ""} ${keeper.lastName || ""}`.trim() || keeper.staffCode || "—"
            : "—",
          totalQty: matchedItems.reduce((sum, item) => sum + (item?.quantity || 0), 0),
          serials: matchedItems.map((item) => ({
            id: item.id,
            serialNumber: item.serialNumber || item.id,
            quantity: item.quantity || 0,
          })),
        });

        return acc;
      }, []);

      setAvailabilityData((prev) => ({
        ...prev,
        [part.id]: {
          branches,
          error: branches.length ? null : "Không tìm thấy kho nào có phụ tùng này.",
        },
      }));
    } catch (error) {
      console.error("Error fetching branch availability:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lấy dữ liệu kho tổng.",
        variant: "destructive",
      });
      setAvailabilityData((prev) => ({
        ...prev,
        [part.id]: {
          branches: [],
          error: error.message || "Không thể lấy dữ liệu kho tổng.",
        },
      }));
    } finally {
      setAvailabilityLoading((prev) => ({ ...prev, [part.id]: false }));
    }
  };

  const toggleBranchRow = (partId, branchId) => {
    setExpandedBranches((prev) => {
      const current = new Set(prev[partId] || []);
      if (current.has(branchId)) {
        current.delete(branchId);
      } else {
        current.add(branchId);
      }
      return { ...prev, [partId]: Array.from(current) };
    });
  };

  const isBranchExpanded = (partId, branchId) => {
    return expandedBranches[partId]?.includes(branchId);
  };

  if (loading || !exportNote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <p className="text-muted-foreground text-sm">Đang tải chi tiết phiếu...</p>
        </div>
      </div>
    );
  }

  const exportDate = exportNote.exportDate
    ? new Date(exportNote.exportDate).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const infoItems = [
    {
      icon: Tag,
      label: "Mã phiếu",
      value: exportNote.code,
      valueClass: "text-lg",
    },
    {
      icon: Package,
      label: "Loại",
      value: (
        <Badge className="bg-red-600 text-white border-none shadow-sm px-4 py-1 rounded-full text-xs">
          {getTypeLabel(exportNote.type)}
        </Badge>
      ),
    },
    {
      icon: Check,
      label: "Trạng thái",
      value: (
        <Badge
          variant="secondary"
          className={`border ${getStatusBadgeClass(
            exportNote.exportNoteStatus || exportNote.status || "PENDING"
          )} px-4`}
        >
          {getStatusLabel(exportNote.exportNoteStatus || exportNote.status || "PENDING")}
        </Badge>
      ),
    },
    {
      icon: Calendar,
      label: "Ngày xuất",
      value: exportDate,
    },
    {
      icon: User,
      label: "Người nhận",
      value: exportNote.exportTo || "—",
    },
    {
      icon: Package,
      label: "Tổng số lượng",
      value: exportNote.totalQuantity,
    },
    {
      icon: DollarSign,
      label: "Tổng giá trị",
      value: formatCurrency(exportNote.totalValue),
    },
    {
      icon: Building2,
      label: "Trung tâm",
      value: exportNote.serviceCenter?.name || "—",
      subText: exportNote.serviceCenter?.address,
    },
    {
      icon: User,
      label: "Người xuất",
      value: exportNote.exportBy
        ? `${exportNote.exportBy.firstName || ""} ${exportNote.exportBy.lastName || ""}`.trim() ||
          exportNote.exportBy.staffCode ||
          "—"
        : "—",
      subText: exportNote.exportBy?.staffCode ? `Mã: ${exportNote.exportBy.staffCode}` : undefined,
    },
    {
      icon: FileText,
      label: "Ghi chú",
      value: exportNote.note || "—",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Danh sách phụ tùng thiếu / Chi tiết / <span className="text-red-600 dark:text-red-400">{exportNote.code}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Chỉ hiển thị thông tin từ đề xuất phụ tùng.</p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card shadow-md overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-gradient-to-r from-red-50 to-red-100/60 dark:from-red-950/30 dark:to-transparent">
            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-foreground">Thông tin phiếu</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {infoItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-white/80 dark:bg-card/70 px-3 py-2 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-200">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <div className={`text-base font-semibold text-foreground ${item.valueClass || ""}`}>
                      {item.value}
                    </div>
                    {item.subText && <p className="text-xs text-muted-foreground">{item.subText}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="parts" className="mb-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger
              value="parts"
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold dark:data-[state=active]:bg-muted"
            >
              Danh sách phụ tùng đề xuất
            </TabsTrigger>
            <TabsTrigger
              value="log"
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold dark:data-[state=active]:bg-muted"
            >
              Nhật ký
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-4">
            <div className="bg-card rounded-xl border border-border shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-b-2 border-red-200/50 dark:border-red-800/30">
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">
                        Mã
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">
                        Tên phụ tùng
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposedParts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 px-6 text-center text-sm text-muted-foreground">
                          Không có phụ tùng nào được đề xuất.
                        </td>
                      </tr>
                    ) : (
                      proposedParts.map((item, idx) => (
                        <Fragment key={item.id || idx}>
                          <tr
                                className={`border-b border-border transition-all duration-200 ${
                                  idx % 2 === 0
                                    ? "bg-gradient-to-r from-white to-rose-50/60 dark:from-card dark:to-red-950/10"
                                    : "bg-white dark:bg-card"
                                } hover:bg-rose-50/80`}
                          >
                              <td className="py-4 px-6 text-sm font-bold text-primary">{item.code}</td>
                            <td className="py-4 px-6 text-sm font-medium text-foreground">{item.name}</td>
                            <td className="py-4 px-6 text-sm text-muted-foreground">{item.description || "—"}</td>
                            <td className="py-4 px-6 text-sm font-bold text-foreground">{item.quantity}</td>
                            <td className="py-4 px-6">
                              <Badge
                                variant="secondary"
                                className={getStatusBadgeClass(item.status || "OUT_OF_STOCK")}
                              >
                                {getStatusLabel(item.status || "OUT_OF_STOCK")}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                variant="secondary"
                                size="sm"
                                className={`gap-2 border border-red-200 dark:border-red-900/50 ${
                                  expandedPartId === item.id
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-white text-red-600 hover:bg-red-50"
                                }`}
                                onClick={() => handleSearchAvailability(item)}
                                disabled={availabilityLoading[item.id]}
                              >
                                <Search className="h-4 w-4" />
                                {expandedPartId === item.id ? "Thu gọn" : "Tìm kiếm"}
                              </Button>
                            </td>
                          </tr>
                          {expandedPartId === item.id && (
                            <tr>
                              <td colSpan={6} className="px-6 pb-6 pt-2 bg-rose-50/60 dark:bg-red-950/10">
                                {availabilityLoading[item.id] || !availabilityData[item.id] ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                    Đang tra cứu kho tổng...
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <p className="text-sm font-semibold text-foreground">
                                      Đề xuất chi nhánh cho phụ tùng {" "}
                                      <span className="text-red-600">{item.name}</span> - {" "}
                                      <span className="text-muted-foreground">{item.code}</span>
                                    </p>
                                    {availabilityData[item.id]?.error ? (
                                      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                                        {availabilityData[item.id].error}
                                      </div>
                                    ) : (
                                      <div className="rounded-2xl border border-border bg-card/70 shadow-sm">
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead className="bg-white/90 dark:bg-card/80">
                                              <tr>
                                                <th className="text-center px-4 py-3 w-16 font-semibold text-muted-foreground">
                                                  STT
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                                  Mã phụ tùng
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                                  Tên phụ tùng
                                                </th>
                                                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                                                  Số lượng tồn kho
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                                  Kho
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                                  Mô tả
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {availabilityData[item.id]?.branches?.map((branch, branchIdx) => {
                                                const expanded = isBranchExpanded(item.id, branch.inventoryId);
                                                return (
                                                  <Fragment key={branch.inventoryId}>
                                                    <tr
                                                      className={`border-b border-border/60 ${
                                                        expanded ? "bg-muted/20" : "bg-card"
                                                      }`}
                                                    >
                                                      <td className="text-center px-4 py-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full bg-muted/40 hover:bg-muted"
                                                            onClick={() =>
                                                              toggleBranchRow(item.id, branch.inventoryId)
                                                            }
                                                          >
                                                            {expanded ? (
                                                              <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                              <ChevronDown className="h-4 w-4" />
                                                            )}
                                                          </Button>
                                                          <p className="text-xs font-medium text-muted-foreground">
                                                            {branchIdx + 1}
                                                          </p>
                                                        </div>
                                                      </td>
                                                      <td className="px-4 py-4 font-semibold text-red-600">
                                                        {item.code}
                                                      </td>
                                                      <td className="px-4 py-4 text-foreground">{item.name}</td>
                                                      <td className="px-4 py-4 text-center">
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                          {branch.totalQty} bộ
                                                        </Badge>
                                                      </td>
                                                      <td className="px-4 py-4">
                                                          <div className="text-sm text-muted-foreground space-y-1">
                                                          <div className="flex items-center gap-2">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            <span>{branch.serviceCenterName}</span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <User className="h-3.5 w-3.5" />
                                                            <span>QL kho: {branch.keeper || "—"}</span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            <span>{branch.phone || "—"}</span>
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="px-4 py-4 text-sm text-muted-foreground">
                                                        {branch.address}
                                                      </td>
                                                    </tr>
                                                    {expanded && (
                                                      <tr className="bg-white/70">
                                                        <td colSpan={6} className="px-4 pb-6">
                                                          <div className="rounded-2xl border border-dashed border-rose-200 bg-white/80 dark:bg-card p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                              <div>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                  Chi tiết serial
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                  {branch.serials?.length || 0} serial được quản lý cho
                                                                  phụ tùng này
                                                                </p>
                                                              </div>
                                                              <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                                                                Tổng {branch.totalQty} bộ
                                                              </Badge>
                                                            </div>
                                                            <div className="overflow-x-auto rounded-xl border border-border bg-card">
                                                              <table className="w-full text-sm">
                                                                <thead className="bg-rose-50/60 dark:bg-red-950/20">
                                                                  <tr>
                                                                    <th className="px-4 py-2 text-left font-semibold">
                                                                      Mã phụ tùng
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left font-semibold">
                                                                      Tên phụ tùng
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left font-semibold">
                                                                      Số serial
                                                                    </th>
                                                                    <th className="px-4 py-2 text-center font-semibold">
                                                                      Số lượng tồn kho
                                                                    </th>
                                                                    <th className="px-4 py-2 text-left font-semibold">
                                                                      Kho
                                                                    </th>
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {branch.serials?.map((serial) => (
                                                                    <tr
                                                                      key={serial.id}
                                                                      className="border-t border-border/40 hover:bg-rose-50/50"
                                                                    >
                                                                      <td className="px-4 py-3 text-primary font-semibold">
                                                                        {item.code}
                                                                      </td>
                                                                      <td className="px-4 py-3 text-foreground">
                                                                        {item.name}
                                                                      </td>
                                                                      <td className="px-4 py-3 text-foreground font-medium">
                                                                        {serial.serialNumber || "—"}
                                                                      </td>
                                                                      <td className="px-4 py-3 text-center">
                                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
                                                                          {serial.quantity || 0}
                                                                        </span>
                                                                      </td>
                                                                      <td className="px-4 py-3 text-sm text-muted-foreground">
                                                                        {branch.serviceCenterName}
                                                                      </td>
                                                                    </tr>
                                                                  ))}
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    )}
                                                  </Fragment>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <div className="bg-card rounded-xl border border-border shadow-md p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-semibold text-foreground">Nhật ký</p>
                <p className="text-sm text-muted-foreground">Chức năng này sẽ được cập nhật sớm</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


