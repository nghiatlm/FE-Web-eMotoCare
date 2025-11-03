import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Edit } from "lucide-react";
import { getExportNotes } from "@/api/exportNotesApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function ExportSlipsTable({ search = "", status = "", woCode = "" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const fetchExportNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getExportNotes(page, pageSize);
      
      if (response.success && response.data) {
        // Transform API data to match UI format
        const transformedRows = response.data.rowDatas.map(item => ({
          id: item.code || item.id,
          exportTo: item.exportTo || "N/A",
          date: item.exportDate || item.createdAt || "",
          totalQuantity: item.totalQuantity || 0,
          rawData: item
        }));
        
        setRows(transformedRows);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching export notes:", err);
      setError(err.message || "Failed to fetch export notes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportNotes();
  }, [page, pageSize]);

  useEffect(() => {
    const applyAddSlip = (slip) => {
      setRows((prev) => {
        const exists = prev.some((r) => r.id === slip.id);
        if (exists) return prev;
        return [slip, ...prev];
      });
    };

    window.applyAddExportSlip = applyAddSlip;
    window.refreshExportNotes = fetchExportNotes;

    return () => {
      if (window.applyAddExportSlip === applyAddSlip) delete window.applyAddExportSlip;
      if (window.refreshExportNotes === fetchExportNotes) delete window.refreshExportNotes;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = rows;

    if (status && status !== "all") {
      result = result.filter((r) => r.status === status);
    }

    if (woCode) {
      result = result.filter((r) => r.woCode?.toLowerCase().includes(woCode.toLowerCase()));
    }

    if (q) {
      result = result.filter((r) =>
        [r.id, r.exportTo].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search, status, woCode]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">Đang tải phiếu xuất...</p>
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
            <p className="text-red-600 dark:text-red-400 mb-2">Lỗi khi tải phiếu xuất</p>
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
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Người nhận</th>
              <th className="text-center py-4 px-6 text-sm font-medium text-muted-foreground">Tổng SL</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Ngày xuất</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="5" className="py-12 px-6 text-center text-sm text-muted-foreground">
                  {search || status ? "Không tìm thấy phiếu xuất phù hợp" : "Chưa có phiếu xuất nào"}
                </td>
              </tr>
            ) : (
              filtered.map((slip, i) => (
                <tr
                  key={`${slip.id}-${i}`}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/10"
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{slip.id}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.exportTo}</td>
                  <td className="py-4 px-6 text-sm text-center text-foreground">{slip.totalQuantity}</td>
                  <td className="py-4 px-6 text-sm text-foreground">
                    {new Date(slip.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => window?.openViewExportSlip?.(slip)}
                      >
                        <Eye className="h-4 w-4" />
                        Chi tiết
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => window?.openEditExportSlip?.(slip)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => window?.printExportSlip?.(slip)}
                      >
                        <Printer className="h-4 w-4" />
                        In phiếu
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

