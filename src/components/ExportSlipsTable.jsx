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
        const transformedRows = response.data.rowDatas.map(item => ({
          id: item.code || item.id,
          exportTo: item.exportTo || "N/A",
          date: item.exportDate || item.createdAt || "",
          totalQuantity: item.totalQuantity || 0,
          status: item.exportNoteStatus || item.status || "PENDING",
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
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-500 dark:border-red-900 dark:border-t-red-600"></div>
            <p className="text-muted-foreground text-sm font-medium">Đang tải phiếu xuất...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-card rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <FileUp className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold">Lỗi khi tải phiếu xuất</p>
            <p className="text-muted-foreground text-sm max-w-md">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-b-2 border-red-200/50 dark:border-red-800/30">
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground uppercase tracking-wide w-[18%]">
                Mã phiếu
              </th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground uppercase tracking-wide w-[15%]">
                Người nhận
              </th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground uppercase tracking-wide w-[12%]">
                Tổng SL
              </th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground uppercase tracking-wide w-[12%]">
                Ngày xuất
              </th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground uppercase tracking-wide w-[13%]">
                Trạng thái
              </th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-foreground uppercase tracking-wide w-[30%]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileUp className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {search || status ? "Không tìm thấy phiếu xuất phù hợp" : "Chưa có phiếu xuất nào"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((slip, i) => (
                <tr
                  key={`${slip.id}-${i}`}
                  className={`border-b border-border/50 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all duration-200 ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/30"
                  }`}
                >
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {slip.id}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-foreground/90">{getServiceCenterName(slip.exportTo)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                        {slip.totalQuantity}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-foreground/90">
                        {slip.date ? new Date(slip.date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <Badge
                        variant="secondary"
                        className={`border ${getStatusBadgeClass(slip.status)}`}
                      >
                        {getStatusLabel(slip.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 px-3 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => window?.openViewExportSlip?.(slip)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                        onClick={() => window?.openEditExportSlip?.(slip)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 px-3 text-xs font-medium hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        onClick={() => window?.printExportSlip?.(slip)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        In phiếu
                      </Button> */}
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
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/30 to-muted/50 border-t border-border/50">
        <div className="text-sm font-medium text-foreground/80">
          Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> / <span className="font-semibold text-foreground">{total}</span> phiếu
        </div>
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={`cursor-pointer transition-all ${
                    page === 1 
                      ? "pointer-events-none opacity-50" 
                      : "hover:bg-red-100 dark:hover:bg-red-900/30"
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
                        ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                        : "hover:bg-red-100 dark:hover:bg-red-900/30"
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
                      : "hover:bg-red-100 dark:hover:bg-red-900/30"
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

