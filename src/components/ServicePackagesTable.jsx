import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

const mockServicePackages = [
  { id: "SP-001", name: "Bảo dưỡng định kỳ", description: "Kiểm tra, vệ sinh và bảo dưỡng xe định kỳ 6 tháng", price: "500,000", duration: "6 months", category: "Maintenance", status: "active" },
  { id: "SP-002", name: "Gói sửa chữa cơ bản", description: "Sửa chữa các lỗi cơ bản, thay thế phụ tùng", price: "1,500,000", duration: "3 months", category: "Repair", status: "active" },
  { id: "SP-003", name: "Gói bảo hành mở rộng", description: "Mở rộng bảo hành lên 24 tháng với hỗ trợ 24/7", price: "3,000,000", duration: "24 months", category: "Warranty", status: "active" },
  { id: "SP-004", name: "Bảo dưỡng cao cấp", description: "Bảo dưỡng chuyên sâu với bộ phận cao cấp", price: "2,500,000", duration: "12 months", category: "Maintenance", status: "inactive" },
  { id: "SP-005", name: "Gói sửa chữa nâng cao", description: "Sửa chữa hệ thống điện, phần mềm và động cơ", price: "5,000,000", duration: "12 months", category: "Repair", status: "active" },
  { id: "SP-006", name: "Gói bảo hành toàn diện", description: "Bảo hành toàn diện tất cả linh kiện trong 36 tháng", price: "8,000,000", duration: "36 months", category: "Warranty", status: "active" },
  { id: "SP-007", name: "Bảo dưỡng nhanh", description: "Dịch vụ bảo dưỡng nhanh trong 2 giờ", price: "300,000", duration: "1 month", category: "Maintenance", status: "inactive" },
  { id: "SP-008", name: "Gói nâng cấp", description: "Nâng cấp và cải tiến hiệu năng xe", price: "10,000,000", duration: "Permanent", category: "Upgrade", status: "active" },
];

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "active":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "inactive":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

const categoryBadge = (category) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (category) {
    case "Maintenance":
      return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
    case "Repair":
      return `${base} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`;
    case "Warranty":
      return `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400`;
    case "Upgrade":
      return `${base} bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

export default function ServicePackagesTable({ search = "", category = "", status = "" }) {
  const [rows, setRows] = useState(mockServicePackages);

  useEffect(() => {
    const applyAdd = (packageItem) => {
      setRows((prev) => {
        const exists = prev.some((r) => r.id === packageItem.id);
        if (exists) return prev;
        return [...prev, packageItem];
      });
    };

    const applyEdit = (packageId, updates) => {
      setRows((prev) =>
        prev.map((r) => (r.id === packageId ? { ...r, ...updates } : r))
      );
    };

    const applyDelete = (packageId) => {
      setRows((prev) => prev.filter((r) => r.id !== packageId));
    };

    window.applyAddServicePackage = applyAdd;
    window.applyEditServicePackage = applyEdit;
    window.applyDeleteServicePackage = applyDelete;

    return () => {
      if (window.applyAddServicePackage === applyAdd) delete window.applyAddServicePackage;
      if (window.applyEditServicePackage === applyEdit) delete window.applyEditServicePackage;
      if (window.applyDeleteServicePackage === applyDelete) delete window.applyDeleteServicePackage;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = rows;

    if (category && category !== "all") {
      result = result.filter((r) => r.category === category);
    }

    if (status && status !== "all") {
      result = result.filter((r) => r.status === status);
    }

    if (q) {
      result = result.filter((r) =>
        [r.id, r.name, r.description, r.price, r.category].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search, category, status]);

  const toggleStatus = (row) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: r.status === "active" ? "inactive" : "active",
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
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">ID</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tên gói</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mô tả</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Giá</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thời hạn</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Danh mục</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center text-sm text-muted-foreground">
                  No service packages found
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/10"
                  }`}
                >
                  <td className="py-4 px-6 text-sm text-muted-foreground">{p.id}</td>
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{p.name}</td>
                  <td className="py-4 px-6 text-sm text-foreground max-w-xs truncate">{p.description}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{p.price}đ</td>
                  <td className="py-4 px-6 text-sm text-foreground">{p.duration}</td>
                  <td className="py-4 px-6">
                    <span className={categoryBadge(p.category)}>{p.category}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={statusBadge(p.status)}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openViewServicePackage?.(p)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openEditServicePackage?.(p)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (window.applyDeleteServicePackage) {
                            window.applyDeleteServicePackage(p.id);
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
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

