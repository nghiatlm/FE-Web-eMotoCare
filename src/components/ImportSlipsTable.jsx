import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { getImportNotes } from "@/api/importNotesApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useServiceCenter } from "@/hooks/useServiceCenter";
import { useNavigate } from "react-router-dom";

export default function ImportSlipsTable({ search = "", typeFilter = "", statusFilter = "" }) {
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
            typeRaw: item.type, // Giữ type gốc để style
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
      console.error("Lỗi khi tải phiếu nhập:", err);
      setError(err.message || "Không thể tải phiếu nhập. Vui lòng thử lại sau.");
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

    // Filter by type
    if (typeFilter && typeFilter !== "all") {
      result = result.filter((r) => {
        const rowType = r.rawData?.type || r.type || "";
        return rowType === typeFilter;
      });
    }

    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((r) => {
        const rowStatus = r.rawData?.importNoteStatus || r.rawData?.status || "";
        return rowStatus === statusFilter;
      });
    }

    // Filter by search
    if (q) {
      result = result.filter((r) =>
        [r.code, r.supplier, r.importByName, r.serviceCenterName, r.type].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search, typeFilter, statusFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col className="w-32" />
          </colgroup>
          <thead>
            <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Mã phiếu</th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Ngày nhập</th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Loại phiếu</th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Tổng giá trị</th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Người nhập</th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-red-700 uppercase">Thao tác</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col className="w-32" />
          </colgroup>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" className="py-12 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground text-sm">Không tìm thấy phiếu nhập phù hợp</p>
                    <p className="text-xs text-muted-foreground">{search ? "Hãy thay đổi từ khóa tìm kiếm" : "Chưa có phiếu nhập nào"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((slip, i) => (
                <tr
                  key={slip.code || slip.rawData?.id || i}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  }`}
                >
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm text-foreground font-medium">{slip.code || "—"}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm text-foreground">{slip.importDate}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {(() => {
                      const typeRaw = slip.typeRaw || slip.rawData?.type || "";
                      let badgeClass = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium";
                      
                      if (typeRaw === "SUPPLIER") {
                        badgeClass += " bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
                      } else if (typeRaw === "TRANSFER_IN") {
                        badgeClass += " bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
                      } else {
                        badgeClass += " bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
                      }
                      
                      return (
                        <Badge className={badgeClass}>
                          {slip.type}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-medium text-foreground">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(slip.totalValue)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm text-foreground">{slip.importByName}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
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
                        <Eye className="h-4 w-4" /> Chi tiết
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

