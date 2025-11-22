import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, Pause, Play, Building2 } from "lucide-react";
import { getServiceCenters } from "@/api/serviceCentersApi";
import { formatPhoneNumber } from "@/utils/formatters";

const initialBranches = [];

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "active":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "inactive":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    case "suspended":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

export function BranchesTable({ search = "", status = "", manager = "" }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialBranches);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getServiceCenters({
          search: search || undefined,
          status: status && status !== "all" ? status : undefined,
          page,
          pageSize,
        });

        const payload = res; // axios interceptor returns response.data
        const list =
          payload?.rowDatas ||
          payload?.data?.rowDatas ||
          payload?.items ||
          payload?.data ||
          [];

        const mapped = list.map((item, idx) => ({
          id: item?.id || item?.code || `BR-${String(idx + 1).padStart(3, "0")}`,
          code: item?.code || "",
          name: item?.name || item?.serviceCenterName || "N/A",
          description: item?.description || "",
          email: item?.email || "",
          location: item?.address || item?.location || "",
          phone: item?.phone || item?.phoneNumber || "",
          manager: item?.managerName || item?.manager || "",
          hours: item?.hours || item?.operatingHours || "",
          status: String(item?.status || "active").toLowerCase(),
          latitude: item?.latitude || item?.lat || item?.geo?.lat || "",
          longitude: item?.longitude || item?.lng || item?.geo?.lng || "",
        }));

        setRows(mapped);
      } catch (e) {
        console.error("Lỗi tải danh sách chi nhánh:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, page, pageSize]);

  useEffect(() => {
    const applyAdd = (branch) => {
      setRows((prev) => {
        const exists = prev.some((r) => r.id === branch.id);
        if (exists) return prev;
        return [...prev, branch];
      });
    };

    const applyEdit = (branchId, updates) => {
      setRows((prev) =>
        prev.map((r) => (r.id === branchId ? { ...r, ...updates } : r))
      );
    };

    window.applyAddBranch = applyAdd;
    window.applyEditBranch = applyEdit;

    return () => {
      if (window.applyAddBranch === applyAdd) delete window.applyAddBranch;
      if (window.applyEditBranch === applyEdit) delete window.applyEditBranch;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = rows;

    // status filter (ignore empty or "all")
    if (status && status !== "all") {
      result = result.filter((r) => r.status === status);
    }

    // manager filter (ignore empty or "all")
    if (manager && manager !== "all") {
      result = result.filter((r) => r.manager === manager);
    }

    // text search across selected fields
    if (q) {
      result = result.filter((r) =>
        [r.id, r.name, r.location, r.phone, r.manager, r.hours]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [rows, search, status, manager]);

  const toggleStatus = (row) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status:
                r.status === "active" ? "suspended" : r.status === "suspended" ? "inactive" : "active",
            }
          : r
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-red-50 via-red-50/90 to-red-100/50 dark:from-red-950/20 dark:via-red-950/15 dark:to-red-900/10 border-b-2 border-red-200/60 dark:border-red-800/30">
              <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-16">STT</th>
              <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tên chi nhánh</th>
              <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Địa chỉ</th>
              <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Số điện thoại</th>
              <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Trạng thái</th>
              <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-16 px-6 text-center">
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
                <td colSpan="6" className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="h-12 w-12 text-slate-300" />
                    <p className="text-base font-medium text-muted-foreground">Không tìm thấy chi nhánh</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => (
                <tr 
                  key={b.id} 
                  className={`transition-all duration-200 ease-in-out group ${
                    i % 2 === 0 
                      ? 'bg-white hover:bg-slate-50/50' 
                      : 'bg-slate-50/30 hover:bg-slate-50'
                  } hover:shadow-md`}
                >
                  <td className="py-5 px-6 text-center text-sm font-medium text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="font-semibold text-slate-900 text-sm">{b.name}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-sm text-slate-700">{b.location || "—"}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-sm text-slate-700">{formatPhoneNumber(b.phone) || "—"}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className={statusBadge(b.status)}>
                        {b.status === "active" ? "Hoạt động" : b.status === "inactive" ? "Ngưng hoạt động" : b.status === "suspended" ? "Tạm dừng" : b.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => window?.openEditBranch?.(b)}
                        title="Sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => navigate(`/admin/branches/${b.id}`)}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 transition-colors ${
                          b.status === "active" 
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        }`}
                        onClick={() => toggleStatus(b)}
                        title={b.status === "active" ? "Tạm dừng" : "Kích hoạt"}
                      >
                        {b.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BranchesTable;


