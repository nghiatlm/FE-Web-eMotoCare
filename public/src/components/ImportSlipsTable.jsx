import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, PackagePlus, Edit } from "lucide-react";
import { getImportNotes } from "@/api/importNotesApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "completed":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "pending":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400`;
    case "cancelled":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

export default function ImportSlipsTable({ search = "", status = "" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const fetchImportNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getImportNotes(page, pageSize);
      
      if (response.success && response.data) {
        // Transform API data to match UI format
        const transformedRows = response.data.rowDatas.map(item => ({
          id: item.code || item.id,
          importDate: item.importDate || item.date || "",
          supplier: item.supplier || item.supplierName || "N/A",
          totalItems: item.items?.length || 0,
          totalValue: item.totalAmount || item.totalValue || 0,
          status: item.status || "pending",
          items: item.items || [],
          rawData: item
        }));
        
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
    fetchImportNotes();
  }, [page, pageSize]);

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
      result = result.filter((r) => r.status === status);
    }

    if (q) {
      result = result.filter((r) =>
        [r.id, r.supplier, r.date].join(" ").toLowerCase().includes(q)
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
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Giá trị</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" className="py-12 px-6 text-center text-sm text-muted-foreground">
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
                  <td className="py-4 px-6 text-sm text-foreground">{slip.importDate}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.supplier}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.totalItems}</td>
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{slip.totalValue}đ</td>
                  <td className="py-4 px-6">
                    <span className={statusBadge(slip.status)}>
                      {slip.status.charAt(0).toUpperCase() + slip.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openViewImportSlip?.(slip)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openEditImportSlip?.(slip)}
                        title="Edit"
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

