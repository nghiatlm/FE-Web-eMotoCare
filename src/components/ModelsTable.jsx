import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, Car, Users, Wrench } from "lucide-react";
import { getModels } from "@/api/modelsApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const initialModels = [];

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "IN_ACTIVE":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Hoạt động",
    IN_ACTIVE: "Ngưng hoạt động",
  };
  return statusMap[status?.toUpperCase()] || status || "—";
};

export function ModelsTable({ search = "", status = "" }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialModels);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getModels({
          search: search || undefined,
          status: status && status !== "all" ? status : undefined,
          page,
          pageSize,
        });

        const payload = res;
        const list =
          payload?.rowDatas ||
          payload?.data?.rowDatas ||
          payload?.data?.data?.rowDatas ||
          payload?.items ||
          payload?.data ||
          [];

        setRows(list);
        const totalCount =
          payload?.data?.total ||
          payload?.total ||
          payload?.data?.data?.total ||
          (Array.isArray(list) ? list.length : 0);
        setTotal(totalCount);
      } catch (e) {
        console.error("Lỗi tải danh sách model:", e);
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, page, pageSize]);

  const filtered = useMemo(() => {
    let result = rows;

    if (status && status !== "all") {
      result = result.filter((r) => r.status?.toUpperCase() === status.toUpperCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((r) =>
        [
          r.code,
          r.name,
          r.manufacturer,
          r.maintenancePlan?.name,
          r.maintenancePlan?.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [rows, search, status]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
      <div className="min-w-[1200px]">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
              <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap w-16">STT</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap min-w-[120px]">Mã model</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap min-w-[150px]">Tên model</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap min-w-[200px]">Nhà sản xuất</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap min-w-[220px]">Kế hoạch bảo dưỡng</th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap min-w-[140px]">Số lượng xe</th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap min-w-[140px]">Trạng thái</th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
                      <div className="absolute inset-0 inline-block animate-spin rounded-full h-12 w-12 border-4 border-transparent border-r-primary/30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <p className="text-base font-semibold text-slate-600 animate-pulse">Đang tải dữ liệu...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Car className="h-12 w-12 text-slate-300" />
                    <p className="text-base font-medium text-muted-foreground">Không tìm thấy model</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => (
                <tr
                  key={m.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  <td className="py-4 px-4 text-center text-sm font-medium text-slate-600 whitespace-nowrap">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 text-sm">{m.code || "—"}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 text-sm">{m.name || "—"}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-sm text-slate-700">{m.manufacturer || "—"}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {m.maintenancePlan ? (
                        <span className="text-sm font-medium text-slate-900">
                          {m.maintenancePlan.name || m.maintenancePlan.code || "—"}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-medium text-slate-700">
                        {m.vehicles?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span className={`${statusBadge(m.status)} whitespace-nowrap`}>
                        {getStatusLabel(m.status)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => navigate(`/admin/models/${m.id}`)}
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
  );
}

export default ModelsTable;

