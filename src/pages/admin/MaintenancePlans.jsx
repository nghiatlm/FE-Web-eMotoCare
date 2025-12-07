import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Calendar, Wrench, Eye, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getMaintenancePlans } from "@/api/maintenancePlansApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-[95%] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Quản lý lịch bảo dưỡng</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi và quản lý các lịch bảo dưỡng định kỳ</p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
        </div>

        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm lịch bảo dưỡng"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
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

            <div className="flex items-center gap-3 ml-auto">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm">
                <Plus className="h-4 w-4" />
                Thêm lịch bảo dưỡng
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header table (không scroll) */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '120px' }} />
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
                  <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide">STT</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Mã lịch</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Tên lịch bảo dưỡng</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Mô tả</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Đơn vị</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Số giai đoạn</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Ngày hiệu lực</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Body table (scroll riêng, thanh scroll dừng dưới header) */}
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '120px' }} />
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
                      <td className="py-4 px-4 text-center text-sm font-medium text-slate-600 align-top">
                        {(page - 1) * pageSize + i + 1}
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className="font-semibold text-slate-900 text-sm">{plan.code}</span>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className="font-semibold text-slate-900 text-sm">{plan.name}</span>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className="text-sm text-slate-700 line-clamp-2">{plan.description || "—"}</span>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => navigate(`/admin/maintenance-plans/${plan.id}/edit`)}
                            title="Sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

