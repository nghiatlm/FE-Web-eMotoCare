import { useState, useEffect, useCallback } from "react";
import { Search, Calendar as CalendarIcon, RefreshCw, Eye, X, FileText, Loader2, AlertCircle } from "lucide-react";
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
        ...(search && { code: search.trim() }),
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

      // Áp dụng lọc theo khoảng ngày ngay trên FE (theo requestedAt)
      let filtered = transformed;
      if (from) {
        const fromStart = new Date(from);
        fromStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter((item) => {
          if (!item.requestedAt) return false;
          const d = new Date(item.requestedAt);
          return d >= fromStart;
        });
      }
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter((item) => {
          if (!item.requestedAt) return false;
          const d = new Date(item.requestedAt);
          return d <= toEnd;
        });
      }

      setRequests(filtered);
      setTotal(filtered.length);
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
  }, [page, pageSize, search, from, to, toast]);

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


  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Danh sách phụ tùng thiếu
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Quản lý các yêu cầu phụ tùng thiếu
          </p>
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
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
              <tr>
                <th className="text-center px-5 py-3 w-16 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  STT
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Mã yêu cầu
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                  Ngày yêu cầu
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                  Trung tâm dịch vụ
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Ghi chú
                </th>
                <th className="text-center px-5 py-3 w-40 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                  Hành động
                </th>
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
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={8}>
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
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={8}>
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : (
                requests.map((request, idx) => {
                  const requestId = request.id || request.appointmentId || idx;
                  const partsCount = request.details?.length || 0;

                  return (
                    <tr
                      key={requestId}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <td className="px-5 py-4 align-top text-sm text-slate-600 text-center whitespace-nowrap">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap align-middle">
                        <span className="text-primary font-semibold tracking-wide">
                          {request.requestCode || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap align-middle">
                        <span className="text-foreground">
                          {formatDateTime(request.requestedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap align-middle">
                        <span className="text-foreground">
                          {request.serviceCenterName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top align-middle">
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md line-clamp-2">
                          {request.note || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-center align-middle whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 rounded-full px-3"
                          onClick={() =>
                            navigate(`/manager/missing-parts/${request.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
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

