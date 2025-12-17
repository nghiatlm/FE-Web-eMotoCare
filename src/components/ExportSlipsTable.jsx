import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Printer, Edit, FileUp } from "lucide-react";
import { getExportNotes } from "@/api/exportNotesApi";
import { getServiceCenters } from "@/api/serviceCentersApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useServiceCenter } from "@/hooks/useServiceCenter";

export default function ExportSlipsTable({ search = "", status = "", woCode = "" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [serviceCenters, setServiceCenters] = useState([]);
  const { serviceCenterId } = useServiceCenter();

  const fetchExportNotes = async () => {
    if (!serviceCenterId) return;
    
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        pageSize,
        ...(status && { status }),
        ...(serviceCenterId && { serviceCenterId }),
      };
      const response = await getExportNotes(params);
      
      if (response.success && response.data) {
        // Transform API data to match UI format
        const transformedRows = response.data.rowDatas.map(item => {
          // Tính tổng số lượng phụ tùng cần xuất từ exportNoteDetails
          const totalPartsQuantity = item.exportNoteDetails?.reduce((sum, detail) => {
            return sum + (detail.quantity || 0);
          }, 0) || item.totalQuantity || 0;
          
          return {
            id: item.code || item.id,
            exportTo: item.exportTo || "N/A",
            date: item.exportDate || item.createdAt || "",
            totalQuantity: totalPartsQuantity,
            status: item.exportNoteStatus || item.status || "PENDING",
            rawData: item
          };
        });
        
        setRows(transformedRows);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      console.error("Lỗi khi tải phiếu xuất:", err);
      setError(err.message || "Không thể tải phiếu xuất. Vui lòng thử lại sau.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch service centers để map ID sang tên
  useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        const response = await getServiceCenters({ page: 1, pageSize: 100 });
        const centers = response?.data?.rowDatas || response?.data || [];
        setServiceCenters(centers);
      } catch (error) {
        console.error("Error fetching service centers:", error);
      }
    };
    fetchServiceCenters();
  }, []);

  useEffect(() => {
    if (serviceCenterId) {
      fetchExportNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status, serviceCenterId]);

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

  // Tạo map từ ID sang tên để tra cứu nhanh - phải đặt trước early returns
  const centerMap = useMemo(() => {
    const map = new Map();
    serviceCenters.forEach(center => {
      if (center.id) {
        map.set(String(center.id), center.name || center.code || String(center.id));
      }
    });
    return map;
  }, [serviceCenters]);

  // Map exportTo (ID) sang tên chi nhánh - phải đặt trước early returns
  const getServiceCenterName = (exportTo) => {
    if (!exportTo) return "N/A";
    
    // Luôn tìm trong map trước (theo ID)
    const centerName = centerMap.get(String(exportTo));
    if (centerName) {
      return centerName;
    }
    
    // Nếu không tìm thấy trong map, có thể đã là tên rồi, trả về giá trị gốc
    return exportTo;
  };

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
      result = result.filter((r) => {
        const exportToName = getServiceCenterName(r.exportTo);
        return [r.id, r.exportTo, exportToName].join(" ").toLowerCase().includes(q);
      });
    }

    return result;
  }, [rows, search, status, woCode, centerMap]);

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Chờ duyệt",
      PROCESSING: "Đang xử lý",
      APPROVED: "Đã duyệt",
      EXPORTING: "Đang xuất",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy"
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
      PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      EXPORTING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
    };
    return classMap[status] || "bg-muted text-muted-foreground border-border";
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur rounded-xl border border-rose-200/60 shadow-md overflow-hidden">
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
      <div className="bg-white/95 backdrop-blur rounded-xl border border-rose-200/60 shadow-md overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2 font-medium">Lỗi khi tải phiếu xuất</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-rose-200/60 overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '5%', minWidth: '40px' }} />
            <col style={{ width: '16%', minWidth: '140px' }} />
            <col style={{ width: '20%', minWidth: '160px' }} />
            <col style={{ width: '14%', minWidth: '100px' }} />
            <col style={{ width: '14%', minWidth: '110px' }} />
            <col style={{ width: '14%', minWidth: '120px' }} />
            <col style={{ width: '17%', minWidth: '120px' }} />
          </colgroup>
          <thead>
            <tr className="bg-gradient-to-r from-rose-100 via-rose-50/80 to-pink-50 border-b border-rose-200">
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                STT
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                Mã phiếu
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                Người nhận
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                Tổng SL
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                Ngày xuất
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                Trạng thái
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold tracking-wide text-rose-800 uppercase whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '5%', minWidth: '40px' }} />
            <col style={{ width: '16%', minWidth: '140px' }} />
            <col style={{ width: '20%', minWidth: '160px' }} />
            <col style={{ width: '14%', minWidth: '100px' }} />
            <col style={{ width: '14%', minWidth: '110px' }} />
            <col style={{ width: '14%', minWidth: '120px' }} />
            <col style={{ width: '17%', minWidth: '120px' }} />
          </colgroup>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" className="py-12 px-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-12 w-12 text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground text-sm font-medium">Không tìm thấy phiếu xuất phù hợp</p>
                    <p className="text-xs text-muted-foreground">{search || status ? "Hãy thay đổi từ khóa hoặc bộ lọc" : "Chưa có phiếu xuất nào"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((slip, i) => {
                const stt = (page - 1) * pageSize + i + 1;
                return (
                <tr
                  key={`${slip.id}-${i}`}
                  className={`border-b border-rose-100/50 hover:bg-rose-50/50 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-rose-50/20"
                  }`}
                >
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <span className="text-sm text-foreground font-medium">
                      {stt}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <span className="text-sm text-foreground font-medium">
                      {slip.id}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <span className="text-sm text-foreground">{getServiceCenterName(slip.exportTo)}</span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
                      {slip.totalQuantity}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <span className="text-sm text-foreground">
                      {slip.date ? new Date(slip.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className={`border ${getStatusBadgeClass(slip.status)}`}
                    >
                      {getStatusLabel(slip.status)}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => window?.openViewExportSlip?.(slip)}
                      >
                        <Eye className="h-3.5 w-3.5" />
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

      {total > 0 && (
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-rose-50/50 border-t border-rose-200/50">
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

