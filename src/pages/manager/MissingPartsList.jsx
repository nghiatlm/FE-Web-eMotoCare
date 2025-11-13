import { useState, useEffect, useMemo } from "react";
import { Search, Calendar as CalendarIcon, RefreshCw, Eye, X, FileText } from "lucide-react";
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

export default function MissingPartsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [fromMonth, setFromMonth] = useState(new Date());
  const [toMonth, setToMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Mock data - sẽ thay bằng API call sau
  const mockRequests = [
    {
      id: "REQ-2025-001",
      code: "REQ-2025-001",
      sentDate: "2025-09-14",
      creator: "Nguyễn Văn A",
      status: "DRAFT",
      note: "Hết tồn, cần cho lịch bảo dưỡng",
    },
    {
      id: "REQ-2025-002",
      code: "REQ-2025-002",
      sentDate: "2025-09-13",
      creator: "Trần Thị B",
      status: "REQUESTED",
      note: "Có đơn hàng chờ giao",
    },
    {
      id: "REQ-2025-003",
      code: "REQ-2025-003",
      sentDate: "2025-09-12",
      creator: "Lê Văn C",
      status: "APPROVED",
      note: "Gấp cho khách bảo hành",
    },
    {
      id: "REQ-2025-004",
      code: "REQ-2025-004",
      sentDate: "2025-09-11",
      creator: "Nguyễn Thị D",
      status: "PENDING",
      note: "Gấp cho khách bảo hành",
    },
    {
      id: "REQ-2025-005",
      code: "REQ-2025-005",
      sentDate: "2025-09-10",
      creator: "Phạm Văn E",
      status: "IN_TRANSIT",
      note: "Gấp cho khách bảo hành",
    },
    {
      id: "REQ-2025-006",
      code: "REQ-2025-006",
      sentDate: "2025-09-09",
      creator: "Lưu Thị F",
      status: "COMPLETED",
      note: "Gấp cho khách bảo hành",
    },
    {
      id: "REQ-2025-007",
      code: "REQ-2025-007",
      sentDate: "2025-09-08",
      creator: "Phạm Tấn T",
      status: "REJECTED",
      note: "Gấp cho khách bảo hành",
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      case "REQUESTED":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Đã yêu cầu</Badge>;
      case "APPROVED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã duyệt</Badge>;
      case "PENDING":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đang đợi phản hồi</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đang vận chuyển</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn tất</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-900 text-red-100 hover:bg-red-900">Từ chối</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRequests = useMemo(() => {
    return mockRequests.filter((req) => {
      // Search filter
      const matchesSearch =
        !search ||
        req.code.toLowerCase().includes(search.toLowerCase()) ||
        req.creator.toLowerCase().includes(search.toLowerCase()) ||
        req.note.toLowerCase().includes(search.toLowerCase());
      
      // Status filter
      const matchesStatus = status === "all" || req.status === status;
      
      // Date range filters
      const startOk = !from || new Date(req.sentDate) >= from;
      const endOk = !to || new Date(req.sentDate) <= to;
      
      return matchesSearch && matchesStatus && startOk && endOk;
    });
  }, [search, status, from, to]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const paginatedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

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

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REQUESTED">Đã yêu cầu</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="PENDING">Đang đợi phản hồi</SelectItem>
                <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
              </SelectContent>
            </Select>

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

            {(status !== "all" || search || from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("all");
                  setSearch("");
                  setFrom(null);
                  setTo(null);
                }}
                className="text-primary hover:text-primary/90"
              >
                Xóa lọc
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button className="whitespace-nowrap bg-primary hover:bg-primary/90">
                Tìm kiếm
              </Button>
              <Button variant="outline" size="icon" title="Refresh" onClick={() => {
                setStatus("all");
                setSearch("");
                setFrom(null);
                setTo(null);
                setPage(1);
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-sm overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
              <tr>
                <th className="text-left px-5 py-3 w-16 font-semibold text-foreground">STT</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Code</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Ngày gửi</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Người tạo</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Trạng thái</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Ghi chú</th>
                <th className="text-left px-5 py-3 w-40 font-semibold text-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={7}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={7}>
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, idx) => (
                  <tr
                    key={req.id}
                    className="bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                  >
                    <td className="px-5 py-4 align-top text-sm font-medium text-muted-foreground">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="text-primary font-semibold tracking-wide cursor-pointer hover:underline">
                        {req.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {req.sentDate ? format(new Date(req.sentDate), "dd-MM-yyyy") : "—"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="text-foreground">{req.creator}</span>
                    </td>
                    <td className="px-5 py-4 align-top">{getStatusBadge(req.status)}</td>
                    <td className="px-5 py-4 align-top">
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        {req.note}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 rounded-full px-3"
                          onClick={() => navigate(`/manager/missing-parts/${req.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                        {req.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-full px-3 text-destructive hover:text-destructive"
                            onClick={() => {
                              // Handle cancel
                            }}
                          >
                            <X className="h-4 w-4" />
                            Hủy
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {filteredRequests.length} mục
            {from && ` • từ ${format(new Date(from), "dd/MM/yyyy")}`}
            {to && ` • đến ${format(new Date(to), "dd/MM/yyyy")}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
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
              disabled={page >= totalPages}
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

