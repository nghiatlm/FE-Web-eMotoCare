import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Pencil, Eye, Pause, Play } from "lucide-react";
import { getServiceCenters } from "@/api/serviceCentersApi";

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
          name: item?.name || item?.serviceCenterName || "N/A",
          location: item?.address || item?.location || "",
          phone: item?.phone || item?.phoneNumber || "",
          manager: item?.managerName || item?.manager || "",
          hours: item?.hours || item?.operatingHours || "",
          status: String(item?.status || "active").toLowerCase(),
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
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Branch ID</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Branch Name</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Location</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Phone Number</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Manager</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Operating Hours</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center text-sm text-muted-foreground">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center text-sm text-muted-foreground">No branches found</td>
              </tr>
            ) : (
              filtered.map((b, i) => (
                <tr key={b.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{b.id}</td>
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{b.name}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{b.location}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{b.phone}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{b.manager}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{b.hours}</td>
                  <td className="py-4 px-6"><span className={statusBadge(b.status)}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span></td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openEditBranch?.(b)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openViewBranch?.(b)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${b.status === "active" ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}`}
                        onClick={() => toggleStatus(b)}
                        title={b.status === "active" ? "Suspend" : "Activate"}
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


