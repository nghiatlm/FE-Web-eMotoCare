import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { getPriceServices } from "@/api/priceServicesApi";
import { useToast } from "@/hooks/use-toast";

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Map remedies to display label
  const getRemediesLabel = (remedies) => {
    const map = {
      REPAIR: "Sửa chữa",
      REPLACE: "Thay thế",
      CHECK: "Kiểm tra",
      NONE: "Không có"
    };
    return map[remedies] || remedies;
  };

  // Map remedies to category (for backward compatibility with old data)
  const mapRemediesToCategory = (remedies) => {
    // Map new enum values to a default category for display purposes
    if (remedies === "REPAIR" || remedies === "REPLACE") {
      return "Repair";
    }
    if (remedies === "CHECK") {
      return "Maintenance";
    }
    if (remedies === "NONE") {
      return "Maintenance";
    }
    // Handle old values
    const oldMap = {
      MAINTENANCE: "Maintenance",
      WARRANTY: "Warranty",
      UPGRADE: "Upgrade"
    };
    return oldMap[remedies] || "Maintenance";
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price || 0);
  };

  const fetchPriceServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPriceServices(page, pageSize);
      
      if (response.success && response.data) {
        const transformedRows = response.data.rowDatas.map(item => ({
          id: item.code || item.id,
          name: item.name || "N/A",
          description: item.description || "",
          price: formatPrice(item.price),
          laborCost: item.laborCost || 0,
          duration: item.effectiveDate 
            ? new Date(item.effectiveDate).toLocaleDateString('vi-VN')
            : "N/A",
          category: mapRemediesToCategory(item.remedies),
          partTypeName: item.partTypeName || "",
          remedies: item.remedies || "",
          status: "active", 
          rawData: item
        }));
        
        setRows(transformedRows);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching price services:", err);
      setError(err.message || "Failed to fetch price services");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchPriceServices();
  }, [fetchPriceServices]);

  useEffect(() => {
    // Expose refresh function
    window.refreshPriceServices = fetchPriceServices;

    return () => {
      if (window.refreshPriceServices === fetchPriceServices) {
        delete window.refreshPriceServices;
      }
    };
  }, [fetchPriceServices]);

  useEffect(() => {
    const applyAdd = (packageItem) => {
      // Refresh data after add
      if (window.refreshPriceServices) {
        window.refreshPriceServices();
      }
    };

    const applyEdit = (packageId, updates) => {
      // Refresh data after edit
      if (window.refreshPriceServices) {
        window.refreshPriceServices();
      }
    };

    const applyDelete = (packageId) => {
      // Refresh data after delete
      if (window.refreshPriceServices) {
        window.refreshPriceServices();
      }
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
        [
          r.id, 
          r.name, 
          r.description, 
          r.price, 
          r.category,
          r.partTypeName,
          r.remedies
        ].join(" ").toLowerCase().includes(q)
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

  // Loading state
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">Đang tải bảng giá dịch vụ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Lỗi khi tải bảng giá dịch vụ</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mã</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tên gói</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mô tả</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Giá</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Chi phí lao động</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Ngày hiệu lực</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Loại xử lý</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Loại phụ tùng</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 px-6 text-center text-sm text-muted-foreground">
                  {search || category || status ? "Không tìm thấy gói dịch vụ phù hợp" : "Chưa có gói dịch vụ nào"}
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
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{p.id}</td>
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{p.name}</td>
                  <td className="py-4 px-6 text-sm text-foreground max-w-xs truncate" title={p.description}>
                    {p.description || "—"}
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold text-foreground">{p.price}₫</td>
                  <td className="py-4 px-6 text-sm text-foreground">{formatPrice(p.laborCost)}₫</td>
                  <td className="py-4 px-6 text-sm text-foreground">{p.duration}</td>
                  <td className="py-4 px-6">
                    <span className={categoryBadge(mapRemediesToCategory(p.remedies))}>
                      {getRemediesLabel(p.remedies)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-foreground">{p.partTypeName || "—"}</td>
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

