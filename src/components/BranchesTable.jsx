import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Pencil, Eye, Pause, Play } from "lucide-react";

const mockBranches = [
  { id: "BR-001", name: "GreenWheel", location: "123 Đường Lê Lợi", phone: "033231321", manager: "Dũng", hours: "08:00 – 17:00 (T2 – T7)", status: "active" },
  { id: "BR-002", name: "GreenWheel", location: "456 Đường Trần Phú", phone: "098323123", manager: "Dung", hours: "09:00 – 18:00 (T2 – CN)", status: "inactive" },
  { id: "BR-003", name: "EcoDrive", location: "789 Đường Nguyễn Huệ", phone: "0982152367", manager: "Thuận", hours: "09:00 – 18:00 (T2 – CN)", status: "inactive" },
  { id: "BR-004", name: "MotoZen", location: "202 Đường Lý Thường Kiệt", phone: "075243721", manager: "Alex", hours: "09:00 – 18:00 (T2 – CN)", status: "active" },
  { id: "BR-005", name: "UrbanCharge", location: "77 Đường Hùng Vương", phone: "0982152367", manager: "Linh", hours: "07:30 – 16:30 (T2 – T6)", status: "inactive" },
  { id: "BR-006", name: "UrbanCharge", location: "77 Đường Hùng Vương", phone: "098323123", manager: "Việt", hours: "07:30 – 16:30 (T2 – T6)", status: "suspended" },
  { id: "BR-007", name: "E-Moto", location: "202 Đường Lý Thường Kiệt", phone: "0982152367", manager: "Tâm", hours: "08:00 – 12:00 (T7)", status: "active" },
  { id: "BR-008", name: "SparkFlow", location: "202 Đường Lý Thường Kiệt", phone: "098323123", manager: "Hoàng", hours: "08:00 – 12:00 (T7)", status: "active" },
  { id: "BR-009", name: "UrbanCharge", location: "77 Đường Hùng Vương", phone: "098323123", manager: "Vương", hours: "07:30 – 16:30 (T2 – T6)", status: "suspended" },
];

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
  const [rows, setRows] = useState(mockBranches);

  useEffect(() => {
    // Expose mutators so the parent page can apply add/edit from dialogs
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
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Manager in Charge</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Operating Hours</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
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


