import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Calendar, Clock, User, Phone, MapPin, Eye, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { getAppointments } from "@/api/appointmentsApi";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AppointmentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Format slotTime from "H17_18" to "17:00 - 18:00"
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

  // Format appointment type
  const formatAppointmentType = (type) => {
    switch (type) {
      case "WARRANTY_TYPE":
        return "Bảo hành";
      case "MAINTENANCE_TYPE":
        return "Bảo dưỡng";
      case "REPAIR_TYPE":
        return "Sửa chữa";
      default:
        return type || "—";
    }
  };

  // Get status badge
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
      case "CANCELLED":
      case "CANCELED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status || "—"}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "CHECKED_IN":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "QUOTE_APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      case "REPAIR_COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
      case "WAITING_FOR_PAYMENT":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "PAYMENT_FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "CANCELLED":
      case "CANCELED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Fetch appointments từ API (có phân trang + search + status)
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments({
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter,
      });
      
      console.log("📋 Appointments API Response:", response);
      
      // Handle response structure: 
      // After axios interceptor returns response.data, we get:
      // { statusCode: 200, success: true, message: "...", data: { rowDatas: [...], total: ... } }
      const appointmentsData = response?.data?.rowDatas || response?.rowDatas || [];
      const totalCount = response?.data?.total || response?.total || 0;
      
      console.log("✅ Parsed appointments:", appointmentsData.length, "Total:", totalCount);
      
      setAppointments(appointmentsData);
      setTotal(totalCount);
    } catch (err) {
      console.error("❌ Error fetching appointments:", err);
      setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
      toast({
        title: "Lỗi",
        description: err?.message || err?.data?.message || "Không thể tải danh sách lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Filter appointments
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
    
    const matchesStatus = statusFilter === "all" || appointment.status?.toUpperCase() === statusFilter.toUpperCase();
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all" && appointment.appointmentDate) {
      const appointmentDate = format(new Date(appointment.appointmentDate), "yyyy-MM-dd");
      matchesDate = appointmentDate === dateFilter;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Get unique dates from appointments
  const uniqueDates = [...new Set(
    appointments
      .map((a) => (a.appointmentDate ? format(new Date(a.appointmentDate), "yyyy-MM-dd") : null))
      .filter(Boolean)
  )];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-slate-900">Danh sách Lịch hẹn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các lịch hẹn tại trung tâm dịch vụ
          </p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70" />
        </div>

        {/* Filters */}
        <div className="mb-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã lịch hẹn, tên, số điện thoại, dịch vụ..."
                value={search}
                onChange={(e) => {
                  setPage(1); // reset về trang 1 khi tìm kiếm
                  setSearch(e.target.value);
                }}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="CHECKED_IN">Đã check-in</SelectItem>
                <SelectItem value="QUOTE_APPROVED">Đã duyệt báo giá</SelectItem>
                <SelectItem value="REPAIR_COMPLETED">Hoàn thành sửa chữa</SelectItem>
                <SelectItem value="WAITING_FOR_PAYMENT">Chờ thanh toán</SelectItem>
                <SelectItem value="PAYMENT_FAILED">Thanh toán thất bại</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                <SelectItem value="CANCELED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Ngày" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ngày</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString("vi-VN")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </div>

        {/* Appointments Table */}
        <div>
          <p className="text-sm text-slate-500 mb-4">
            {loading
              ? "Đang tải dữ liệu..."
              : `Tổng số lịch hẹn: ${total} (Hiển thị: ${filteredAppointments.length})`}
          </p>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header table (không scroll) */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                    <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase w-16">
                      STT
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                      Mã lịch hẹn
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                      Khách hàng
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                      Loại dịch vụ
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                      Ngày/giờ
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                      Trung tâm dịch vụ
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                      Trạng thái
                    </th>
                    <th className="text-center py-4 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase w-32">
                      Thao tác
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Body table (scroll riêng, thanh scroll dừng dưới header) */}
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full">
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
                          <td className="py-4 px-4 text-sm text-slate-600 text-center">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-foreground text-sm">{appointment.code || "—"}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-foreground">{customerName}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="text-foreground font-medium">{serviceType}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-foreground">{appointmentDate}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  {slotTime}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-foreground">{serviceCenterName}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(appointment.status)}
                              {getStatusBadge(appointment.status)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
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
                                Xem chi tiết
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

