import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, Pause, Play, Building2 } from "lucide-react";
import { getServiceCenters, deleteServiceCenter } from "@/api/serviceCentersApi";
import { formatPhoneNumber } from "@/utils/formatters";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";

const initialBranches = [];

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "active":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "in_active":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

export function BranchesTable({ search = "", status = "" }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialBranches);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [reloadFlag, setReloadFlag] = useState(0);

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

        const payload = res; 
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
        const totalCount =
          payload?.total ||
          payload?.data?.total ||
          (Array.isArray(list) ? list.length : 0);
        setTotal(totalCount);
      } catch (e) {
        console.error("Lỗi tải danh sách chi nhánh:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, page, pageSize, reloadFlag]);

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

    const reloadBranches = () => {
      setReloadFlag((prev) => prev + 1);
    };

    window.applyAddBranch = applyAdd;
    window.applyEditBranch = applyEdit;
    window.reloadBranches = reloadBranches;

    return () => {
      if (window.applyAddBranch === applyAdd) delete window.applyAddBranch;
      if (window.applyEditBranch === applyEdit) delete window.applyEditBranch;
      if (window.reloadBranches === reloadBranches) delete window.reloadBranches;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = rows;

    if (status && status !== "all") {
      result = result.filter((r) => r.status === status);
    }

    if (q) {
      result = result.filter((r) =>
        [r.id, r.code, r.name, r.location, r.phone]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [rows, search, status]);

  const handleDeleteClick = (branch) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete?.id) return;

    try {
      setDeleting(true);
      await deleteServiceCenter(branchToDelete.id);
      
      toast.success(`Đã ngừng hoạt động chi nhánh: ${branchToDelete.name}`, {
        position: "top-right",
        autoClose: 4000,
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === branchToDelete.id
            ? { ...r, status: "in_active" }
            : r
        )
      );
    } catch (error) {
      console.error("Error deleting service center:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể ngừng hoạt động chi nhánh. Vui lòng thử lại.";
      toast.error(`Lỗi: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: '70px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '250px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '150px' }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">STT</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Mã chi nhánh</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Tên chi nhánh</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Địa chỉ</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Số điện thoại</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Trạng thái</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap sticky right-0 bg-red-50 z-20 border-l border-red-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 px-6 text-center">
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
                  <td colSpan={7} className="py-16 px-6 text-center">
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
                    className={`group border-b border-slate-200 transition-colors ${
                      i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  >
                    <td className="py-4 px-4 text-center text-sm text-slate-600 whitespace-nowrap align-middle">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="py-4 px-5 text-sm font-semibold text-slate-900 whitespace-nowrap truncate align-middle">
                      {b.code || "—"}
                    </td>
                    <td className="py-4 px-5 text-sm font-semibold text-slate-900 whitespace-nowrap truncate align-middle">
                      {b.name}
                    </td>
                    <td className="py-4 px-5 text-sm text-slate-700 whitespace-nowrap truncate align-middle">
                      {b.location || "—"}
                    </td>
                    <td className="py-4 px-5 text-sm text-slate-700 whitespace-nowrap truncate align-middle">
                      {formatPhoneNumber(b.phone) || "—"}
                    </td>
                    <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                      <span className={`${statusBadge(b.status)} whitespace-nowrap`}>
                        {b.status === "active" ? "Hoạt động" : b.status === "in_active" ? "Ngưng hoạt động" : b.status}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-center align-middle sticky right-0 z-10 border-l border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
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
                          onClick={() => {
                            if (!b.id) {
                              console.error("BranchesTable: Cannot navigate - branch id is missing", b);
                              return;
                            }
                            console.log("BranchesTable: Navigating to branch detail:", b.id);
                            navigate(`/admin/branches/${b.id}`);
                          }}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {b.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            onClick={() => handleDeleteClick(b)}
                            title="Ngừng hoạt động"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <div className="flex justify-center px-4 py-3 border-t border-slate-200 bg-slate-50">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className={`h-8 px-2.5 text-xs cursor-pointer rounded-full ${
                    page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                  }`}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                    className={`h-8 min-w-[32px] cursor-pointer rounded-full px-2.5 text-xs ${
                      page === pageNum
                        ? "bg-red-100 text-red-700 font-semibold"
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
                  className={`h-8 px-2.5 text-xs cursor-pointer rounded-full ${
                    page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận ngừng hoạt động</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn ngừng hoạt động chi nhánh <strong>{branchToDelete?.name}</strong>? 
              Hành động này sẽ vô hiệu hóa chi nhánh trong hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BranchesTable;


