import { useState, useEffect, useCallback } from "react";
import { Search, Calendar as CalendarIcon, Eye, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import { getAppointments } from "@/api/appointmentsApi";
import { toast } from "react-toastify";
import { format } from "date-fns";

export default function AppointmentsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const formatSlotTime = (slotTime) => {
    if (!slotTime) return "—";
    const match = slotTime.match(/H(\d+)_(\d+)/);
    if (match) {
      const start = match[1];
      const end = match[2];
      return `${start}:00 - ${end}:00`;
    }
    return slotTime;
  };

  const formatAppointmentType = (type) => {
    switch (type) {
      case "WARRANTY_TYPE":
        return "Bảo hành";
      case "MAINTENANCE_TYPE":
        return "Bảo dưỡng";
      case "REPAIR_TYPE":
        return "Sửa chữa";
      case "CAMPAIGN_TYPE":
        return "Chiến dịch";
      case "RECALL_TYPE":
        return "Triệu hồi";
      default:
        return type || "—";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xử lý</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã duyệt</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đã check-in</Badge>;
      case "QUOTE_APPROVED":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Đã duyệt báo giá</Badge>;
      case "REPAIR_COMPLETED":
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Hoàn thành sửa chữa</Badge>;
      case "WAITING_FOR_PAYMENT":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Chờ thanh toán</Badge>;
      case "PAYMENT_FAILED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Thanh toán thất bại</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
      case "CANCELED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status || "—"}</Badge>;
    }
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments({
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      
      
      const appointmentsData = response?.data?.rowDatas || response?.rowDatas || [];
      const totalCount = response?.data?.total || response?.total || 0;
      
      
      setAppointments(appointmentsData);
      setTotal(totalCount);
    } catch (err) {
      setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
      toast.error(`Lỗi: ${err?.message || err?.data?.message || "Không thể tải danh sách lịch hẹn"}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = appointments.filter((appointment) => {
    const customerName = `${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim();
    const phone = appointment.customer?.phone || "";
    const serviceType = formatAppointmentType(appointment.type);
    const searchLower = search.toLowerCase();
    
    const matchesSearch =
      customerName.toLowerCase().includes(searchLower) ||
      phone.includes(search) ||
      serviceType.toLowerCase().includes(searchLower) ||
      appointment.code?.toLowerCase().includes(searchLower);
    
    const matchesStatus = !statusFilter || appointment.status?.toUpperCase() === statusFilter.toUpperCase();
    
    let matchesDate = true;
    if (dateFilter && appointment.appointmentDate) {
      const appointmentDate = format(new Date(appointment.appointmentDate), "yyyy-MM-dd");
      matchesDate = appointmentDate === dateFilter;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Danh sách Lịch hẹn</h1>
          <p className="text-base md:text-lg font-medium text-slate-700 mt-2">
            Quản lý các lịch hẹn tại trung tâm dịch vụ
          </p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]" />
        </div>

        <div className="mb-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full md:flex-1 md:min-w-[260px] md:max-w-[520px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã lịch hẹn, tên, số điện thoại, dịch vụ..."
                value={search}
                onChange={(e) => {
                  setPage(1); 
                  setSearch(e.target.value);
                }}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="CHECKED_IN">Đã check-in</SelectItem>
                <SelectItem value="QUOTE_APPROVED">Đã duyệt báo giá</SelectItem>
                <SelectItem value="REPAIR_COMPLETED">Hoàn thành sửa chữa</SelectItem>
                <SelectItem value="WAITING_FOR_PAYMENT">Chờ thanh toán</SelectItem>
                <SelectItem value="PAYMENT_FAILED">Thanh toán thất bại</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[150px] md:w-[180px] justify-start bg-slate-50 border-slate-200 text-left font-normal text-slate-700 hover:bg-slate-100"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Tất cả ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setPage(1);
                    setSelectedDate(date);
                    if (date) {
                      setDateFilter(format(date, "yyyy-MM-dd"));
                    } else {
                      setDateFilter("");
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-500 mb-4">
            {loading
              ? "Đang tải dữ liệu..."
              : `Tổng số lịch hẹn: ${total} (Hiển thị: ${filteredAppointments.length})`}
          </p>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-hidden">
            <div className="overflow-x-hidden">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                    <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      STT
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Mã lịch hẹn
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Khách hàng
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Loại dịch vụ
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Ngày/giờ
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Trung tâm dịch vụ
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="max-h-[520px] overflow-y-auto overflow-x-hidden">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang tải danh sách lịch hẹn...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <p className="text-destructive mb-3">{error}</p>
                        <Button onClick={fetchAppointments} variant="outline">
                          Thử lại
                        </Button>
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        Không tìm thấy lịch hẹn nào
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment, index) => {
                      const customerName = `${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim() || "—";
                      const serviceType = formatAppointmentType(appointment.type);
                      const appointmentDate = appointment.appointmentDate 
                        ? format(new Date(appointment.appointmentDate), "dd/MM/yyyy")
                        : "—";
                      const slotTime = formatSlotTime(appointment.slotTime);
                      const serviceCenterName = appointment.serviceCenter?.name || "—";

                      return (
                        <tr
                          key={appointment.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="py-4 px-4 text-sm text-slate-600 text-center align-top whitespace-nowrap">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="font-medium text-foreground text-sm whitespace-nowrap overflow-hidden text-ellipsis block">{appointment.code || "—"}</div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div>
                              <div className="font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis block">{customerName}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div>
                              <div className="text-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis block">{serviceType}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="whitespace-nowrap">
                              <div className="text-foreground">{appointmentDate}</div>
                              <div className="text-sm text-muted-foreground">
                                {slotTime}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis block">{serviceCenterName}</div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {getStatusBadge(appointment.status)}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center align-top whitespace-nowrap">
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  navigate(`/manager/appointments/${appointment.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
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

          {/* Pagination – dùng chung style với admin (BranchesTable) */}
          {!loading && total > 0 && (
            <div className="mt-4 flex items-center justify-center px-6 py-4 border-t border-slate-200/80 bg-slate-50/60">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className={`cursor-pointer rounded-full px-3 ${
                        page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                      }`}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                        className={`cursor-pointer rounded-full px-3 py-1 text-sm ${
                          page === pageNum
                            ? "bg-red-100 text-red-700 font-medium"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      className={`cursor-pointer rounded-full px-3 ${
                        page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

