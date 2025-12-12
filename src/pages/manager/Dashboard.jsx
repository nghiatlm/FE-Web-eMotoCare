import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAppointments } from "@/services/appointmentService";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getDashboardOverview } from "@/api/dashboardApi";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalStaff: 0,
    activeStaff: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    revenue: 0,
    revenueChange: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Lấy serviceCenterId và load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingStats(true);
        
        // Lấy accountId từ user
        const accountId = user?.accountResponse?.id;
        if (!accountId) {
          console.error("Không tìm thấy accountId");
          return;
        }

        // Lấy serviceCenterId từ staff
        const staffResponse = await getStaffByAccountId(accountId, { page: 1, pageSize: 10 });
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (!staffData?.serviceCenterId) {
          console.error("Không tìm thấy serviceCenterId");
          return;
        }

        const serviceCenterId = staffData.serviceCenterId;

        // Call API dashboard overview
        const dashboardResponse = await getDashboardOverview(serviceCenterId);
        const dashboardData = dashboardResponse?.data || dashboardResponse;

        // Call API appointments để tính toán thống kê chi tiết
        try {
          const appointmentsResponse = await fetchAppointments({ 
            page: 1, 
            pageSize: 1000, 
            serviceCenterId 
          });
          
          const appointmentsData =
            appointmentsResponse?.data?.data?.rowDatas ||
            appointmentsResponse?.data?.rowDatas ||
            appointmentsResponse?.rowDatas ||
            [];

          // Tính toán thống kê từ appointments
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayAppointments = appointmentsData.filter(apt => {
            if (!apt.appointmentDate) return false;
            const aptDate = new Date(apt.appointmentDate);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime();
          }).length;

          const pendingAppointments = appointmentsData.filter(apt => {
            const status = apt.status?.toUpperCase();
            return status === "PENDING" || status === "APPROVED" || status === "QUOTE_APPROVED" || status === "WAITING_FOR_PAYMENT";
          }).length;

          const completedAppointments = appointmentsData.filter(apt => {
            const status = apt.status?.toUpperCase();
            return status === "COMPLETED" || status === "REPAIR_COMPLETED";
          }).length;

          const cancelledAppointments = appointmentsData.filter(apt => {
            const status = apt.status?.toUpperCase();
            return status === "CANCELLED" || status === "CANCELED" || status === "PAYMENT_FAILED";
          }).length;

          // Map dữ liệu từ API vào stats
          setStats({
            totalAppointments: dashboardData.totalAppointment || appointmentsData.length || 0,
            todayAppointments: todayAppointments,
            totalStaff: 0, // API không có, cần call API khác
            activeStaff: 0, // API không có, cần call API khác
            pendingAppointments: pendingAppointments,
            completedAppointments: completedAppointments,
            cancelledAppointments: cancelledAppointments,
            revenue: dashboardData.totalRevenue || 0,
            revenueChange: 0, // API không có, có thể tính từ dữ liệu tháng trước
          });
        } catch (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          // Nếu không lấy được appointments, chỉ dùng data từ dashboard API
          setStats({
            totalAppointments: dashboardData.totalAppointment || 0,
            todayAppointments: 0,
            totalStaff: 0,
            activeStaff: 0,
            pendingAppointments: 0,
            completedAppointments: 0,
            cancelledAppointments: 0,
            revenue: dashboardData.totalRevenue || 0,
            revenueChange: 0,
          });
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    const loadRecentAppointments = async () => {
      try {
        setRecentLoading(true);
        setRecentError(null);

        // Lấy accountId và serviceCenterId để filter appointments
        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        const staffResponse = await getStaffByAccountId(accountId, { page: 1, pageSize: 10 });
        const staffData = staffResponse?.data?.rowDatas?.[0];
        const serviceCenterId = staffData?.serviceCenterId;

        // Lấy 5 lịch hẹn mới nhất cho dashboard
        const response = await fetchAppointments({ 
          page: 1, 
          pageSize: 5,
          serviceCenterId 
        });

        // Sau interceptor, data thường có dạng { statusCode, data: { rowDatas, total, ... } }
        const data =
          response?.data?.data?.rowDatas ||
          response?.data?.rowDatas ||
          response?.rowDatas ||
          [];

        setRecentAppointments(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent appointments:", error);
        setRecentError("Không thể tải danh sách lịch hẹn gần đây.");
        setRecentAppointments([]);
      } finally {
        setRecentLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
      loadRecentAppointments();
    }
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Định dạng slotTime "H13_14" -> "13:00 - 14:00"
  const formatSlotTime = (slotTime) => {
    if (!slotTime) return "—";
    if (!slotTime.startsWith("H")) return slotTime;
    const parts = slotTime.replace("H", "").split("_");
    if (parts.length === 2) {
      const [start, end] = parts;
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
    const s = status?.toUpperCase();
    if (!s) return <Badge variant="secondary">—</Badge>;

    if (
      s === "PENDING" ||
      s === "APPROVED" ||
      s === "QUOTE_APPROVED" ||
      s === "WAITING_FOR_PAYMENT"
    ) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xử lý</Badge>;
    }

    if (s === "COMPLETED" || s === "REPAIR_COMPLETED") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
    }

    if (s === "CANCELLED" || s === "CANCELED" || s === "PAYMENT_FAILED") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
    }

    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard Trung tâm Dịch vụ</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan hoạt động của trung tâm dịch vụ
          </p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70" />
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hôm nay: {stats.todayAppointments} lịch hẹn
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaff}/{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang làm việc / Tổng số
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.revenueChange}% so với tháng trước
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn chờ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cần xử lý ngay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completedAppointments}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingAppointments}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {((stats.pendingAppointments / stats.totalAppointments) * 100).toFixed(1)}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Đã hủy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.cancelledAppointments}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)}% tổng số
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>Lịch hẹn gần đây</CardTitle>
          <CardDescription>Danh sách 5 lịch hẹn mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {recentLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Đang tải lịch hẹn gần đây...
              </div>
            ) : recentError ? (
              <div className="py-8 text-center text-sm text-red-500">{recentError}</div>
            ) : recentAppointments.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Chưa có lịch hẹn nào gần đây.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-12">
                      STT
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                      Mã lịch hẹn
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                      Khách hàng
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                      Loại dịch vụ
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                      Ngày/giờ
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                      Trung tâm
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appointment, index) => {
                    const customerName =
                      `${appointment.customer?.firstName || ""} ${
                        appointment.customer?.lastName || ""
                      }`.trim() || "—";
                    const phone = appointment.customer?.phone || "—";
                    const service = formatAppointmentType(appointment.type);
                    const time = appointment.appointmentDate
                      ? format(new Date(appointment.appointmentDate), "HH:mm")
                      : formatSlotTime(appointment.slotTime);
                    const centerName =
                      appointment.serviceCenter?.name ||
                      appointment.serviceCenter?.code ||
                      "—";

                    return (
                      <tr
                        key={appointment.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-sm text-slate-600">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {appointment.code || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-slate-900">{customerName}</div>
                            <div className="text-xs text-slate-500">{phone}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">{service}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{time || "—"}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{centerName}</td>
                        <td className="py-3 px-4">{getStatusBadge(appointment.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

