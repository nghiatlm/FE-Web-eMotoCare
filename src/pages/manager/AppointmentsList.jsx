import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Calendar, Clock, User, Phone, MapPin, Eye, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { getAppointments } from "@/api/appointmentsApi";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useServiceCenter } from "@/hooks/useServiceCenter";

export default function AppointmentsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { serviceCenterId } = useServiceCenter();
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
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đã check-in</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã duyệt</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
      case "CANCELLED":
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
      case "CHECKED_IN":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!serviceCenterId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments({ page, pageSize, serviceCenterId });
      
      const appointmentsData = response?.data?.rowDatas || response?.rowDatas || [];
      const totalCount = response?.data?.total || response?.total || 0;
      
      setAppointments(appointmentsData);
      setTotal(totalCount);
    } catch (err) {
      setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
      toast({
        title: "Lỗi",
        description: err?.message || err?.data?.message || "Không thể tải danh sách lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, toast, serviceCenterId]);

  useEffect(() => {
    if (serviceCenterId) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, [fetchAppointments, serviceCenterId]);

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
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Danh sách Lịch hẹn</h1>
        <p className="text-muted-foreground">Quản lý các lịch hẹn tại trung tâm dịch vụ</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, số điện thoại, dịch vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="CHECKED_IN">Đã check-in</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
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
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch hẹn ({filteredAppointments.length})</CardTitle>
          <CardDescription>
            {loading ? "Đang tải..." : `Tổng số lịch hẹn: ${total} (Hiển thị: ${filteredAppointments.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Đang tải danh sách lịch hẹn...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchAppointments} className="mt-4" variant="outline">
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã lịch hẹn</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Khách hàng</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Loại dịch vụ</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ngày/giờ</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trung tâm dịch vụ</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-muted-foreground">
                        Không tìm thấy lịch hẹn nào
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment) => {
                      const customerName = `${appointment.customer?.firstName || ""} ${appointment.customer?.lastName || ""}`.trim() || "—";
                      const customerPhone = appointment.customer?.phone || "—";
                      const serviceType = formatAppointmentType(appointment.type);
                      const vehicleInfo = appointment.vehicle 
                        ? `${appointment.vehicle.color || ""} ${appointment.vehicle.chassisNumber || ""}`.trim() || "—"
                        : appointment.maintenanceStage 
                        ? appointment.maintenanceStage.name || "—"
                        : "—";
                      const appointmentDate = appointment.appointmentDate 
                        ? format(new Date(appointment.appointmentDate), "dd/MM/yyyy")
                        : "—";
                      const slotTime = formatSlotTime(appointment.slotTime);
                      const serviceCenterName = appointment.serviceCenter?.name || "—";

                      return (
                        <tr
                          key={appointment.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-foreground text-sm">{appointment.code || "—"}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-foreground">{customerName}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {customerPhone}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="text-foreground font-medium">{serviceType}</div>
                              <div className="text-sm text-muted-foreground mt-1">{vehicleInfo}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <div className="text-foreground">{appointmentDate}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to appointment detail
                                navigate(`/manager/appointments/${appointment.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Trang {page}/{totalPages} — Hiển thị {filteredAppointments.length} / {total}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage((prev) => prev - 1);
                          }}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((pageNumber, index) =>
                        pageNumber === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === page}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(pageNumber);
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage((prev) => prev + 1);
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

