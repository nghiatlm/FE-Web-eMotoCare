import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileDown } from "lucide-react";
import { getImportNotes } from "@/api/importNotesApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useServiceCenter } from "@/hooks/useServiceCenter";
import { useNavigate } from "react-router-dom";

export default function ImportSlipsTable({ search = "", typeFilter = "" }) {
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

          const typeLabelMap = {
            "SUPPLIER": "Nhà cung cấp",
            "TRANSFER_IN": "Nhận điều chuyển",
            "WARRANTY_RETURN": "Hoàn kho bảo hành"
          };
          const typeLabel = typeLabelMap[item.type] || item.type || "N/A";

          const totalItems = item.importNoteDetails?.length || 0;

          const supplierDisplay = item.supplier || item.importFrom || "—";

          return {
            code: item.code,
            importDate: importDate,
            supplier: supplierDisplay,
            type: typeLabel,
            typeRaw: item.type,
            totalItems: totalItems,
            totalValue: item.totalAmout || item.totalAmount || 0, 
            importByName: importByName,
            serviceCenterName: serviceCenterName,
            rawData: item
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

    if (typeFilter && typeFilter !== "all") {
      result = result.filter((r) => {
        const rowType = r.rawData?.type || r.type || "";
        return rowType === typeFilter;
      });
    }

    if (q) {
      result = result.filter((r) =>
        [r.code, r.supplier, r.importByName, r.serviceCenterName, r.type].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search, typeFilter]);

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur rounded-xl border border-rose-200/60 shadow-md overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">Đang tải phiếu nhập...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/95 backdrop-blur rounded-xl border border-rose-200/60 shadow-md overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2 font-medium">Lỗi khi tải phiếu nhập</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: '60px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '140px' }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">STT</th>
                <th className="text-left py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Mã phiếu</th>
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Ngày nhập</th>
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Loại phiếu</th>
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Tổng giá trị</th>
                <th className="text-left py-4 px-5 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">Người nhập</th>
                <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap sticky right-0 bg-red-50 z-20 border-l border-red-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileDown className="h-12 w-12 text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground text-sm font-medium">Không tìm thấy phiếu nhập phù hợp</p>
                      <p className="text-xs text-muted-foreground">{search || typeFilter ? "Hãy thay đổi từ khóa hoặc bộ lọc" : "Chưa có phiếu nhập nào"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((slip, i) => {
                  const stt = (page - 1) * pageSize + i + 1;
                  return (
                    <tr
                      key={slip.code || slip.rawData?.id || i}
                      className={`group border-b border-slate-200 transition-colors ${
                        i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-100/60"
                      }`}
                    >
                      <td className="py-4 px-4 text-center text-sm text-slate-600 whitespace-nowrap align-middle">
                        {stt}
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-primary whitespace-nowrap align-middle">
                        {slip.code || "—"}
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-slate-900 whitespace-nowrap align-middle">
                        {slip.importDate}
                      </td>
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        {(() => {
                          const typeRaw = slip.typeRaw || slip.rawData?.type || "";
                          let badgeClass = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shadow-sm whitespace-nowrap";
                          
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
                      <td className="py-4 px-4 text-center text-sm font-semibold text-emerald-700 whitespace-nowrap align-middle">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(slip.totalValue)}
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-900 whitespace-nowrap truncate align-middle">
                        {slip.importByName}
                      </td>
                      <td className={`py-4 px-4 text-center align-middle sticky right-0 z-10 border-l border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-8 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
                            onClick={() => {
                              if (slip.rawData?.id) {
                                navigate(`/storekeeper/import-slips/${slip.rawData.id}`);
                              }
                            }}
                            title="Xem chi tiết"
                            disabled={!slip.rawData?.id}
                          >
                            <Eye className="h-4 w-4" /> 
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between p-5 bg-slate-50 border-t border-slate-200">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={`cursor-pointer transition-all ${
                    page === 1 
                      ? "pointer-events-none opacity-50" 
                      : "hover:bg-rose-100 dark:hover:bg-rose-900/30"
                  }`}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(pageNum => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                    className={`cursor-pointer transition-all ${
                      page === pageNum
                        ? "bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                        : "hover:bg-rose-100 dark:hover:bg-rose-900/30"
                    }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
                  className={`cursor-pointer transition-all ${
                    page >= Math.ceil(total / pageSize)
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-rose-100 dark:hover:bg-rose-900/30"
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

