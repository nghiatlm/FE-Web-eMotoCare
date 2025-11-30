import { useState, useEffect, useCallback } from "react";
import { Search, Calendar as CalendarIcon, RefreshCw, Eye, X, FileText, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getExportNotes } from "@/api/exportNotesApi";
import { useToast } from "@/hooks/use-toast";

export default function MissingPartsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [fromMonth, setFromMonth] = useState(new Date());
  const [toMonth, setToMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Fetch missing parts requests
  const fetchMissingParts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        outOfStock: true,
      };

      const response = await getExportNotes(params);
      
      console.log("📋 Missing Parts Requests API Response:", response);
      
      const rowDatas = response?.data?.rowDatas || [];
      const transformed = rowDatas.map((note, idx) => {
        const exportBy = note.exportBy;
        const creatorName = exportBy
          ? `${exportBy.firstName || ""} ${exportBy.lastName || ""}`.trim() || exportBy.staffCode || "—"
          : "—";
        const details = (note.exportNoteDetails || []).map((detail, detailIdx) => {
          const part = detail.proposedReplacePart || detail.partItem?.part;
          return {
            index: detail.id || detailIdx,
            image: part?.image || null,
            code: part?.code || "—",
            name: part?.name || "—",
            requestedQty: detail.quantity || 0,
            suggestCenter: note.serviceCenter?.name || note.serviceCenter?.code || "—",
            stockStatus: "Hết hàng",
          };
        });

        return {
          id: note.id || idx,
          appointmentId: note.appointmentId || null,
          requestCode: note.code || note.id,
          requestedAt: note.exportDate || note.createdAt,
          createdByName: creatorName,
          serviceCenterName: note.serviceCenter?.name || note.serviceCenter?.code || "—",
          note: note.note || "—",
          details,
        };
      });
      setRequests(transformed);
      setTotal(response?.data?.total ?? transformed.length);
    } catch (err) {
      console.error("Error fetching missing parts requests:", err);
      setError("Không thể tải danh sách yêu cầu phụ tùng thiếu. Vui lòng thử lại sau.");
      toast({
        title: "Lỗi",
        description: err?.message || err?.data?.message || "Không thể tải danh sách yêu cầu phụ tùng thiếu",
        variant: "destructive",
      });
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, toast]);

  useEffect(() => {
    fetchMissingParts();
  }, [fetchMissingParts]);

  // Format date from API response
  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch (error) {
      return dateString;
    }
  };


  // Get stock status badge
  const getStockStatusBadge = (stockStatus) => {
    switch (stockStatus) {
      case "Có thể điều chuyển":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Có thể điều chuyển</Badge>;
      case "Hết hàng":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Hết hàng</Badge>;
      default:
        return <Badge variant="secondary">{stockStatus || "—"}</Badge>;
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (appointmentId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const isExpanded = (appointmentId) => expandedItems.has(appointmentId);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Danh sách phụ tùng thiếu</h1>
          </div>
          <p className="text-muted-foreground">Quản lý các yêu cầu phụ tùng thiếu</p>
        </div>

        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nhập từ khóa ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>


            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {from ? format(from, "dd/MM/yyyy", { locale: vi }) : "Từ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b flex items-center gap-2">
                  <Select
                    value={fromMonth.getFullYear().toString()}
                    onValueChange={(year) => {
                      const newDate = new Date(fromMonth);
                      newDate.setFullYear(parseInt(year));
                      setFromMonth(newDate);
                    }}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setFromMonth(new Date())}
                  >
                    Năm nay
                  </Button>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={from}
                  onSelect={setFrom}
                  month={fromMonth}
                  onMonthChange={setFromMonth}
                  initialFocus
                  locale={vi}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {to ? format(to, "dd/MM/yyyy", { locale: vi }) : "Đến"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b flex items-center gap-2">
                  <Select
                    value={toMonth.getFullYear().toString()}
                    onValueChange={(year) => {
                      const newDate = new Date(toMonth);
                      newDate.setFullYear(parseInt(year));
                      setToMonth(newDate);
                    }}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setToMonth(new Date())}
                  >
                    Năm nay
                  </Button>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={to}
                  onSelect={setTo}
                  month={toMonth}
                  onMonthChange={setToMonth}
                  initialFocus
                  locale={vi}
                />
              </PopoverContent>
            </Popover>

            {(search || from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFrom(null);
                  setTo(null);
                  setPage(1);
                }}
                className="text-primary hover:text-primary/90"
              >
                Xóa lọc
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button 
                className="whitespace-nowrap bg-primary hover:bg-primary/90"
                onClick={() => {
                  setPage(1);
                  fetchMissingParts();
                }}
              >
                Tìm kiếm
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                title="Refresh" 
                onClick={() => {
                  setSearch("");
                  setFrom(null);
                  setTo(null);
                  setPage(1);
                  fetchMissingParts();
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-sm overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
              <tr>
                <th className="text-left px-5 py-3 w-12 font-semibold text-foreground"></th>
                <th className="text-left px-5 py-3 w-16 font-semibold text-foreground">STT</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Mã yêu cầu</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Ngày yêu cầu</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Người tạo</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Trung tâm dịch vụ</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Số lượng phụ tùng</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Ghi chú</th>
                <th className="text-left px-5 py-3 w-40 font-semibold text-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={9}>
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={9}>
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <p className="text-destructive">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchMissingParts} className="mt-2">
                        Thử lại
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={9}>
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : (
                requests.map((request, idx) => {
                  const requestId = request.id || request.appointmentId || idx;
                  const isExpandedItem = isExpanded(requestId);
                  const partsCount = request.details?.length || 0;

                  return (
                    <>
                      <tr
                        key={requestId}
                        className="bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                      >
                        <td className="px-5 py-4 align-top">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleExpand(requestId)}
                          >
                            {isExpandedItem ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </td>
                        <td className="px-5 py-4 align-top text-sm font-medium text-muted-foreground">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="text-primary font-semibold tracking-wide">
                            {request.requestCode || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="text-foreground">{formatDateTime(request.requestedAt)}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="text-foreground">{request.createdByName || "—"}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="text-foreground">{request.serviceCenterName || "—"}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <Badge variant="outline">{partsCount} mục</Badge>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                            {request.note || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-full px-3"
                            onClick={() => navigate(`/manager/missing-parts/${request.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                      {isExpandedItem && request.details && request.details.length > 0 && (
                        <tr key={`${requestId}-details`}>
                          <td colSpan={9} className="px-5 py-4 bg-muted/20">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-foreground mb-3">
                                Danh sách phụ tùng ({partsCount} mục)
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border-separate border-spacing-y-2 table-fixed">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="text-center px-4 py-2 font-semibold text-foreground w-[150px]">Hình ảnh</th>
                                      <th className="text-center px-4 py-2 font-semibold text-foreground w-[150px]">Mã phụ tùng</th>
                                      <th className="text-center px-4 py-2 font-semibold text-foreground w-[200px]">Tên phụ tùng</th>
                                      <th className="text-center px-4 py-2 font-semibold text-foreground w-[110px]">Số lượng yêu cầu</th>
                                      <th className="text-center px-4 py-2 font-semibold text-foreground w-[200px]">Trung tâm đề xuất</th>
                                      <th className="text-center px-4 py-2 font-semibold text-foreground w-[150px]">Tình trạng kho</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {request.details.map((part, partIdx) => (
                                      <tr
                                        key={part.index || partIdx}
                                        className="bg-background border border-border/60 hover:bg-muted/30 transition-colors"
                                      >
                                        <td className="px-4 py-3 align-middle text-center">
                                          {part.image ? (
                                            <img
                                              src={part.image}
                                              alt={part.name}
                                              className="w-20 h-20 object-cover rounded-lg border border-border mx-auto"
                                              onError={(e) => {
                                                e.target.style.display = "none";
                                              }}
                                            />
                                          ) : (
                                            <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center mx-auto">
                                              <span className="text-xs text-muted-foreground">No image</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 align-middle text-center">
                                          <span className="font-semibold text-foreground">{part.code || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3 align-middle text-center">
                                          <span className="text-foreground break-words">{part.name || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3 align-middle text-center">
                                          <span className="font-medium text-foreground">{part.requestedQty || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 align-middle text-center">
                                          <span className="text-sm text-foreground break-words">{part.suggestCenter || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                          {getStockStatusBadge(part.stockStatus)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {total} mục
            {from && ` • từ ${format(from, "dd/MM/yyyy")}`}
            {to && ` • đến ${format(to, "dd/MM/yyyy")}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={page === pageNum ? "default" : "outline"}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

