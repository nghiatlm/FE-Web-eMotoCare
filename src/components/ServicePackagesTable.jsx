import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Package, Calendar, Hash } from "lucide-react";
import { getPriceServices } from "@/api/priceServicesApi";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
    if (remedies === "CLEAN" || remedies === "TUNE") {
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
      
      console.log("📋 Price Services API Response:", response);
      
      // Handle response structure: 
      // After axios interceptor returns response.data, we get:
      // { statusCode: 200, success: true, message: "...", data: { rowDatas: [...], total: ... } }
      const priceServicesData = response?.data?.rowDatas || response?.rowDatas || [];
      const totalCount = response?.data?.total || response?.total || 0;
      
      console.log("✅ Parsed price services:", priceServicesData.length, "Total:", totalCount);
      
      if (priceServicesData.length > 0 || totalCount >= 0) {
        const transformedRows = priceServicesData.map(item => ({
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
        setTotal(totalCount);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("❌ Error fetching price services:", err);
      setError(err?.message || err?.data?.message || "Không thể tải bảng giá dịch vụ. Vui lòng thử lại sau.");
      setRows([]);
      toast({
        title: "Lỗi",
        description: err?.message || err?.data?.message || "Không thể tải bảng giá dịch vụ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, toast]);

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
      <Card className="border border-border/60 bg-card overflow-hidden rounded-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60">
          <CardTitle className="text-xl">Danh sách gói dịch vụ</CardTitle>
        </CardHeader>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <Package className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground mb-1">Đang tải dữ liệu...</p>
              <p className="text-sm text-muted-foreground">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border border-red-200 shadow-xl bg-red-50/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-50/30 border-b border-red-200">
          <CardTitle className="text-xl text-red-900">Lỗi tải dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-red-900 mb-2">Không thể tải bảng giá dịch vụ</p>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchPriceServices}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Thử lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="border border-border/60 bg-card overflow-hidden rounded-lg">
        <CardHeader className="bg-muted/50 border-b border-border/60 px-6 py-4">
          <CardTitle className="text-lg font-semibold">Danh sách gói dịch vụ</CardTitle>
        </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border/60">
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap w-[120px]">
                  Mã
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                  Tên gói
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap w-[110px]">
                  Giá
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap w-[140px]">
                  Ngày hiệu lực
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap w-[110px]">
                  Loại xử lý
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                  Loại phụ tùng
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap w-[110px]">
                  Trạng thái
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-foreground whitespace-nowrap w-[120px]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-base font-medium text-muted-foreground">
                        {search || category || status ? "Không tìm thấy gói dịch vụ phù hợp" : "Chưa có gói dịch vụ nào"}
                      </p>
                      {search || category || status ? (
                        <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc để tìm kiếm</p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600 font-mono">{p.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">{p.price}₫</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">{p.duration}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={categoryBadge(mapRemediesToCategory(p.remedies))}>
                        {getRemediesLabel(p.remedies)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-foreground truncate max-w-[200px]" title={p.partTypeName}>
                        {p.partTypeName || <span className="text-muted-foreground italic">—</span>}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={statusBadge(p.status)}>
                        {p.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground hover:bg-muted"
                          onClick={() => window?.openViewServicePackage?.(p)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground hover:bg-muted"
                          onClick={() => window?.openEditServicePackage?.(p)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground hover:bg-muted"
                          onClick={() => {
                            if (window.applyDeleteServicePackage) {
                              window.applyDeleteServicePackage(p.id);
                            }
                          }}
                          title="Xóa"
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

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border/60 bg-muted/30">
            <div className="text-sm text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> / <span className="font-semibold text-foreground">{total}</span> gói dịch vụ
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className={cn(
                      "cursor-pointer transition-all",
                      page === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(pageNum => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className={cn(
                        "cursor-pointer transition-all",
                        page === pageNum && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
                    className={cn(
                      "cursor-pointer transition-all",
                      page >= Math.ceil(total / pageSize) && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

