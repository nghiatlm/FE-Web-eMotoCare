import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, PackagePlus, Edit } from "lucide-react";
import { getImportNotes } from "@/api/importNotesApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useServiceCenter } from "@/hooks/useServiceCenter";

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  const statusUpper = (status || "").toUpperCase();
  switch (statusUpper) {
    case "COMPLETED":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "PENDING":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400`;
    case "CANCELLED":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

const getStatusLabel = (status) => {
  const statusMap = {
    PENDING: "Chờ xử lý",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy"
  };
  return statusMap[status?.toUpperCase()] || status || "N/A";
};

export default function ImportSlipsTable({ search = "", status = "" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const { serviceCenterId } = useServiceCenter();

  const fetchImportNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getImportNotes(page, pageSize, serviceCenterId);
      
      if (response.success && response.data) {
        // Transform API data to match UI format
        const transformedRows = response.data.rowDatas.map(item => {
          // Format date
          const importDate = item.importDate 
            ? new Date(item.importDate).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : "";

          // Get importBy name
          const importByName = item.importBy 
            ? `${item.importBy.firstName || ""} ${item.importBy.lastName || ""}`.trim() || item.importBy.staffCode || "N/A"
            : "N/A";

          // Get service center name
          const serviceCenterName = item.serviceCenter
            ? item.serviceCenter.name || item.serviceCenter.code || "N/A"
            : "N/A";

          // Get type label
          const typeLabel = item.type === "SUPPLIER" ? "Nhà cung cấp" : item.type || "N/A";

          // Count part items (if partItemId exists in rawData, otherwise 0)
          const totalItems = item.partItemId?.length || item.partItems?.length || 0;

          return {
            id: item.code || item.id,
            importDate: importDate,
            importFrom: item.importFrom || "N/A",
            supplier: item.supplier || "N/A",
            type: typeLabel,
            totalItems: totalItems,
            totalValue: item.totalAmout || item.totalAmount || 0, // Note: API has typo "totalAmout"
            importByName: importByName,
            serviceCenterName: serviceCenterName,
            status: item.importNoteStatus || item.status || "PENDING",
            rawData: item
          };
        });
        
        setRows(transformedRows);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching import notes:", err);
      setError(err.message || "Failed to fetch import notes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceCenterId) {
      fetchImportNotes();
    }
  }, [page, pageSize, serviceCenterId]);

  useEffect(() => {
    const applyAddSlip = (slip) => {
      setRows((prev) => {
        const exists = prev.some((r) => r.id === slip.id);
        if (exists) return prev;
        return [slip, ...prev];
      });
    };

    window.applyAddImportSlip = applyAddSlip;
    window.refreshImportNotes = fetchImportNotes;

    return () => {
      if (window.applyAddImportSlip === applyAddSlip) delete window.applyAddImportSlip;
      if (window.refreshImportNotes === fetchImportNotes) delete window.refreshImportNotes;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = rows;

    if (status && status !== "all") {
      // Map UI status to API status
      const statusMap = {
        "pending": "PENDING",
        "completed": "COMPLETED",
        "cancelled": "CANCELLED"
      };
      const apiStatus = statusMap[status.toLowerCase()] || status.toUpperCase();
      result = result.filter((r) => (r.status || "").toUpperCase() === apiStatus);
    }

    if (q) {
      result = result.filter((r) =>
        [r.id, r.supplier, r.importFrom, r.importByName, r.serviceCenterName].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search, status]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">Đang tải phiếu nhập...</p>
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
            <p className="text-red-600 dark:text-red-400 mb-2">Lỗi khi tải phiếu nhập</p>
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
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mã phiếu</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Ngày nhập</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Nhà cung cấp</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Số mặt hàng</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tổng giá trị</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Người nhập</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="11" className="py-12 px-6 text-center text-sm text-muted-foreground">
                  {search || status ? "Không tìm thấy phiếu nhập phù hợp" : "Chưa có phiếu nhập nào"}
                </td>
              </tr>
            ) : (
              filtered.map((slip, i) => (
                <tr
                  key={slip.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/10"
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{slip.id}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.importDate || "N/A"}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.supplier}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.totalItems}</td>
                  <td className="py-4 px-6 text-sm font-medium text-foreground">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(slip.totalValue)}
                  </td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.importByName}</td>
                  <td className="py-4 px-6">
                    <span className={statusBadge(slip.status)}>
                      {getStatusLabel(slip.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openViewImportSlip?.(slip)}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openEditImportSlip?.(slip)}
                        title="Chỉnh sửa"
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
      {total > pageSize && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Hiển thị {filtered.length} / {total} phiếu
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(pageNum => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
                  className={page >= Math.ceil(total / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

