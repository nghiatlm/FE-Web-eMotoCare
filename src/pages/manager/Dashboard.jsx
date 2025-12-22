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
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAppointments } from "@/services/appointmentService";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getDashboardOverview, getDashboardOverviewData } from "@/api/dashboardApi";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalWarranty: 0,
    warrantyChange: 0,
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

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingStats(true);
        
        const accountId = user?.accountResponse?.id;
        if (!accountId) {
          return;
        }

        const staffResponse = await getStaffByAccountId(accountId, { page: 1, pageSize: 10 });
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (!staffData?.serviceCenterId) {
          return;
        }

        const serviceCenterId = staffData.serviceCenterId;

        const dashboardResponse = await getDashboardOverview(serviceCenterId);
        const dashboardData = dashboardResponse?.data || dashboardResponse;

        let currentMonthRevenue = dashboardData.totalRevenue || 0;
        let revenueChangePercent = 0;
        let currentMonthAppointments = dashboardData.totalAppointment || 0;
        let appointmentsChangePercent = 0;
        let currentMonthWarranty = dashboardData.totalRMA || 0;
        let warrantyChangePercent = 0;

        try {
          const currentYear = new Date().getFullYear();
          const overviewResponseForStats = await getDashboardOverviewData(currentYear);
          const overviewDataForStats = overviewResponseForStats?.data?.data;
          
          if (Array.isArray(overviewDataForStats) && overviewDataForStats.length > 0) {
            const currentMonth = new Date().getMonth() + 1;
            const currentMonthData = overviewDataForStats.find((item) => Number(item.month) === currentMonth);
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousMonthData = overviewDataForStats.find((item) => Number(item.month) === previousMonth);
            
            if (currentMonthData) {
              currentMonthRevenue = Number(currentMonthData.revenue) || 0;
              currentMonthAppointments = Number(currentMonthData.total) || 0;
              currentMonthWarranty = Number(currentMonthData.warranty) || 0;
            }
            
            if (previousMonthData) {
              const previousMonthRevenue = Number(previousMonthData.revenue) || 0;
              if (previousMonthRevenue > 0) {
                revenueChangePercent = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
              } else if (currentMonthRevenue > 0) {
                revenueChangePercent = 100;
              } else {
                revenueChangePercent = 0;
              }
              
              const previousMonthAppointments = Number(previousMonthData.total) || 0;
              if (previousMonthAppointments > 0) {
                appointmentsChangePercent = ((currentMonthAppointments - previousMonthAppointments) / previousMonthAppointments) * 100;
              } else if (currentMonthAppointments > 0) {
                appointmentsChangePercent = 100;
              } else {
                appointmentsChangePercent = 0;
              }
              
              const previousMonthWarranty = Number(previousMonthData.warranty) || 0;
              if (previousMonthWarranty > 0) {
                warrantyChangePercent = ((currentMonthWarranty - previousMonthWarranty) / previousMonthWarranty) * 100;
              } else if (currentMonthWarranty > 0) {
                warrantyChangePercent = 100;
              } else {
                warrantyChangePercent = 0;
              }
            }
          }
        } catch (overviewError) {
          console.error("Error fetching overview data:", overviewError);
        }


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

          setStats({
            totalAppointments: currentMonthAppointments || appointmentsData.length || 0,
            todayAppointments: todayAppointments,
            totalWarranty: currentMonthWarranty,
            warrantyChange: Number.isFinite(warrantyChangePercent) ? warrantyChangePercent : 0,
            pendingAppointments: pendingAppointments,
            completedAppointments: completedAppointments,
            cancelledAppointments: cancelledAppointments,
            revenue: currentMonthRevenue,
            revenueChange: Number.isFinite(revenueChangePercent) ? revenueChangePercent : 0,
          });
        } catch (appointmentsError) {
          setStats({
            totalAppointments: currentMonthAppointments || 0,
            todayAppointments: 0,
            totalWarranty: currentMonthWarranty,
            warrantyChange: Number.isFinite(warrantyChangePercent) ? warrantyChangePercent : 0,
            pendingAppointments: 0,
            completedAppointments: 0,
            cancelledAppointments: 0,
            revenue: currentMonthRevenue,
            revenueChange: Number.isFinite(revenueChangePercent) ? revenueChangePercent : 0,
          });
        }
      } catch (error) {
      } finally {
        setLoadingStats(false);
      }
    };

    const loadRecentAppointments = async () => {
      try {
        setRecentLoading(true);
        setRecentError(null);

        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        const staffResponse = await getStaffByAccountId(accountId, { page: 1, pageSize: 10 });
        const staffData = staffResponse?.data?.rowDatas?.[0];
        const serviceCenterId = staffData?.serviceCenterId;

        const response = await fetchAppointments({ 
          page: 1, 
          pageSize: 5,
          serviceCenterId 
        });

        const data =
          response?.data?.data?.rowDatas ||
          response?.data?.rowDatas ||
          response?.rowDatas ||
          [];

        setRecentAppointments(data.slice(0, 5));
      } catch (error) {
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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    if (num % 1 === 0) {
      return num.toString();
    }
    return num.toFixed(1);
  };

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
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Chờ xử lý
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Đã duyệt
          </Badge>
        );
      case "CHECKED_IN":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Đã check-in
          </Badge>
        );
      case "QUOTE_APPROVED":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Đã duyệt báo giá
          </Badge>
        );
      case "REPAIR_COMPLETED":
        return (
          <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
            Hoàn thành sửa chữa
          </Badge>
        );
      case "WAITING_FOR_PAYMENT":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Chờ thanh toán
          </Badge>
        );
      case "PAYMENT_FAILED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Thanh toán thất bại
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Hoàn thành
          </Badge>
        );
      case "CANCELLED":
      case "CANCELED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "—"}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-rose-50 to-rose-100">
      <div className="w-full px-6 lg:px-10 py-8 space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Dashboard Trung tâm Dịch vụ
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Tổng quan hoạt động của trung tâm dịch vụ
          </p>
          <div className="mt-3 h-[3px] w-24 rounded-full bg-rose-400/80" />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
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

        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số lượng bảo hành</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWarranty}</div>
            <div className={`flex items-center text-xs mt-1 ${
              stats.warrantyChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.warrantyChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              <span>
                {stats.warrantyChange >= 0 ? '+' : ''}
                {formatPercent(stats.warrantyChange)}% so với tháng trước
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <div className={`flex items-center text-xs mt-1 ${
              stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              <span>
                {stats.revenueChange >= 0 ? '+' : ''}
                {formatPercent(stats.revenueChange)}% so với tháng trước
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completedAppointments}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingAppointments}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Đã hủy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.cancelledAppointments}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/95 border border-rose-100 shadow-md rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Lịch hẹn gần đây</CardTitle>
          <CardDescription>Danh sách lịch hẹn mới nhất</CardDescription>
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
                    const phone = appointment.phone || "—";
                    const service = formatAppointmentType(appointment.type);
                    const appointmentDate = appointment.appointmentDate
                      ? format(new Date(appointment.appointmentDate), "dd/MM/yyyy")
                      : "—";
                    const timeRange = formatSlotTime(appointment.slotTime);
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
                        <td className="py-3 px-4 text-sm text-slate-900">
                          <div className="whitespace-nowrap">
                            <div className="text-foreground">{appointmentDate}</div>
                            <div className="text-xs text-slate-500">
                              {timeRange}
                            </div>
                          </div>
                        </td>
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

