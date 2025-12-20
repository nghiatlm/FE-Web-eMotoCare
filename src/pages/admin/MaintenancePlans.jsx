import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Calendar, Wrench, Eye, Loader2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getMaintenancePlans } from "@/api/maintenancePlansApi";
import { syncMaintenancePlansData } from "@/api/maintenancePlansApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-toastify";

const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Ngưng hoạt động",
    SUSPENDED: "Tạm dừng",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
    INACTIVE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    SUSPENDED: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  };
  return classMap[status] || "bg-slate-100 text-slate-700 border-slate-200";
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateString;
  }
};

export default function MaintenancePlans() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      };

      const response = await getMaintenancePlans(params);
      const rowDatas = response?.rowDatas || response?.data?.rowDatas || [];
      
      const mappedPlans = rowDatas.map((plan) => ({
        id: plan.id,
        code: plan.code || "",
        name: plan.name || "",
        description: plan.description || "",
        unit: plan.unit || [],
        totalStages: plan.totalStages || 0,
        effectiveDate: plan.effectiveDate || "",
        status: plan.status || "ACTIVE",
      }));
      
      setPlans(mappedPlans);
      setTotal(response?.total || response?.data?.total || 0);
    } catch (error) {
      console.error("Error fetching maintenance plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [page, pageSize, search, statusFilter]);

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus("syncing");
    try {
      const res = await syncMaintenancePlansData();
      const ok =
        res?.success === true ||
        res?.statusCode === 200 ||
        res?.data?.success === true ||
        res?.data?.statusCode === 200;
      if (ok) {
        setSyncStatus("success");
        setLastSync(new Date().toISOString());
        toast.success("Đồng bộ lịch bảo dưỡng thành công");
        fetchPlans();
      } else {
        setSyncStatus("error");
        toast.error("Đồng bộ không thành công. Vui lòng thử lại.");
      }
    } catch (err) {
      setSyncStatus("error");
      toast.error("Đồng bộ thất bại. Vui lòng thử lại.");
    } finally {
      setSyncing(false);
    }
  };

  const filteredPlans = useMemo(() => {
    if (search) {
      return plans;
    }
    return plans.filter((plan) => {
      if (statusFilter !== "all" && plan.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [plans, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quản lý lịch bảo dưỡng</h1>
          <p className="mt-2 text-base md:text-lg font-medium text-slate-700">Theo dõi và quản lý các lịch bảo dưỡng định kỳ</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm mb-6">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Lịch và giai đoạn bảo dưỡng</h3>
                  <p className="text-sm text-slate-600">
                    Đồng bộ dữ liệu lịch bảo dưỡng từ hệ thống OEM
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {syncStatus === "success" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã đồng bộ
                      </span>
                    )}
                    {syncStatus === "error" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Lỗi đồng bộ
                      </span>
                    )}
                    {syncStatus === "syncing" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang đồng bộ
                      </span>
                    )}
                    {syncStatus === "idle" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                        <Clock className="h-3.5 w-3.5" />
                        Chưa đồng bộ
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      Lần gần nhất: {formatDateTime(lastSync)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:ml-auto flex-shrink-0 w-full md:w-auto">
                <Button
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 gap-2 px-6"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Đồng bộ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px] md:min-w-[320px] md:max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm lịch bảo dưỡng"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
                <SelectItem value="SUSPENDED">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
              </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                  <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">STT</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Mã lịch</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Tên lịch bảo dưỡng</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Mô tả</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Đơn vị</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Số giai đoạn</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Ngày hiệu lực</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Trạng thái</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
              </colgroup>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
                          <div className="absolute inset-0 inline-block animate-spin rounded-full h-12 w-12 border-4 border-transparent border-r-primary/30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        </div>
                        <p className="text-base font-semibold text-slate-600 animate-pulse">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Wrench className="h-12 w-12 text-slate-300" />
                        <p className="text-base font-medium text-muted-foreground">Không tìm thấy lịch bảo dưỡng</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan, i) => (
                    <tr
                      key={plan.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="py-4 px-4 text-center text-sm font-medium text-slate-600 align-top whitespace-nowrap">
                        {(page - 1) * pageSize + i + 1}
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">{plan.code}</span>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className="font-semibold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis block">{plan.name}</span>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className="text-sm text-slate-700 line-clamp-1 md:line-clamp-2 max-w-[200px] md:max-w-[320px] block overflow-hidden text-ellipsis">{plan.description || "—"}</span>
                      </td>
                      <td className="py-4 px-6 text-center align-top">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {plan.unit && plan.unit.length > 0 ? (
                            plan.unit.map((u, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs whitespace-nowrap">
                                {u === "KILOMETER" ? "KM" : u === "MONTH" ? "Tháng" : u}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center align-top">
                        <span className="text-sm font-medium text-slate-700">{plan.totalStages}</span>
                      </td>
                      <td className="py-4 px-6 text-center align-top">
                        <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700">
                          <span>{formatDate(plan.effectiveDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center align-top">
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadgeClass(plan.status)}`}
                          >
                            {getStatusLabel(plan.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center align-top">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            onClick={() => navigate(`/admin/maintenance-plans/${plan.id}`)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-center px-6 py-4 border-t border-slate-200/80 bg-slate-50/60">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className={`cursor-pointer rounded-full px-3 ${
                        page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                      }`}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                        className={`cursor-pointer rounded-full px-3 py-1 text-sm ${
                          page === pageNum
                            ? "bg-red-100 text-red-700 font-medium"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      className={`cursor-pointer rounded-full px-3 ${
                        page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

