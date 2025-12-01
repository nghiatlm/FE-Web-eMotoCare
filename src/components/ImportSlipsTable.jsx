import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit } from "lucide-react";
import { getImportNotes } from "@/api/importNotesApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useServiceCenter } from "@/hooks/useServiceCenter";
import { useNavigate } from "react-router-dom";

export default function ImportSlipsTable({ search = "" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const { serviceCenterId } = useServiceCenter();
  const navigate = useNavigate();

  const fetchImportNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getImportNotes(page, pageSize, serviceCenterId);
      
      if (response.success && response.data) {
        const transformedRows = response.data.rowDatas.map(item => {
          const importDate = item.importDate 
            ? new Date(item.importDate).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : "N/A";

          const importByName = item.importBy 
            ? `${item.importBy.firstName || ""} ${item.importBy.lastName || ""}`.trim() || item.importBy.staffCode || "N/A"
            : "N/A";

          const serviceCenterName = item.serviceCenter
            ? item.serviceCenter.name || item.serviceCenter.code || "N/A"
            : "N/A";

          // Map type labels
          const typeLabelMap = {
            "SUPPLIER": "Nhà cung cấp",
            "TRANSFER_IN": "Nhận điều chuyển",
            "WARRANTY_RETURN": "Hoàn kho bảo hành"
          };
          const typeLabel = typeLabelMap[item.type] || item.type || "N/A";

          // Tính số mặt hàng từ importNoteDetails
          const totalItems = item.importNoteDetails?.length || 0;

          // Format supplier/importFrom
          const supplierDisplay = item.supplier || item.importFrom || "—";

          return {
            code: item.code, // Dùng code làm id cho navigation
            importDate: importDate,
            supplier: supplierDisplay,
            type: typeLabel,
            totalItems: totalItems,
            totalValue: item.totalAmout || item.totalAmount || 0, 
            importByName: importByName,
            serviceCenterName: serviceCenterName,
            rawData: item // Giữ rawData để navigate và edit
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
        const exists = prev.some((r) => (r.code || r.id) === (slip.code || slip.id));
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

    if (q) {
      result = result.filter((r) =>
        [r.code, r.supplier, r.importByName, r.serviceCenterName, r.type].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search]);

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
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Loại</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tổng giá trị</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Người nhập</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center text-sm text-muted-foreground">
                  {search ? "Không tìm thấy phiếu nhập phù hợp" : "Chưa có phiếu nhập nào"}
                </td>
              </tr>
            ) : (
              filtered.map((slip, i) => (
                <tr
                  key={slip.code || slip.rawData?.id || i}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/10"
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-semibold text-primary">{slip.code || "—"}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.importDate}</td>
                  <td className="py-4 px-6">
                    <Badge variant="outline" className="text-xs">
                      {slip.type}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-foreground">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(slip.totalValue)}
                  </td>
                  <td className="py-4 px-6 text-sm text-foreground">{slip.importByName}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (slip.rawData?.id) {
                            navigate(`/storekeeper/import-slips/${slip.rawData.id}`);
                          }
                        }}
                        title="Xem chi tiết"
                        disabled={!slip.rawData?.id}
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

