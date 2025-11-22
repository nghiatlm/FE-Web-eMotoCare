import { useEffect, useState } from "react";
import { Calendar, Users, Wrench, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
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

  useEffect(() => {
    // Mock data - sẽ thay bằng API call sau
    setStats({
      totalAppointments: 156,
      todayAppointments: 12,
      totalStaff: 24,
      activeStaff: 20,
      pendingAppointments: 45,
      completedAppointments: 98,
      cancelledAppointments: 13,
      revenue: 125000000,
      revenueChange: 12.5,
    });
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const recentAppointments = [
    {
      id: 1,
      customerName: "Nguyễn Văn A",
      phone: "0901234567",
      service: "Bảo dưỡng định kỳ",
      time: "09:00",
      status: "pending",
      staff: "Trần Thị B",
    },
    {
      id: 2,
      customerName: "Lê Thị C",
      phone: "0907654321",
      service: "Sửa chữa lốp",
      time: "10:30",
      status: "completed",
      staff: "Phạm Văn D",
    },
    {
      id: 3,
      customerName: "Hoàng Văn E",
      phone: "0912345678",
      service: "Thay dầu nhớt",
      time: "14:00",
      status: "pending",
      staff: "Nguyễn Thị F",
    },
    {
      id: 4,
      customerName: "Đỗ Thị G",
      phone: "0923456789",
      service: "Kiểm tra tổng thể",
      time: "15:30",
      status: "cancelled",
      staff: "Lê Văn H",
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xử lý</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Trung tâm Dịch vụ</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động của trung tâm dịch vụ</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
        <Card>
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

        <Card>
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

        <Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn gần đây</CardTitle>
          <CardDescription>Danh sách các lịch hẹn mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dịch vụ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thời gian</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nhân viên</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-foreground">{appointment.customerName}</div>
                        <div className="text-sm text-muted-foreground">{appointment.phone}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{appointment.service}</td>
                    <td className="py-3 px-4 text-foreground">{appointment.time}</td>
                    <td className="py-3 px-4 text-foreground">{appointment.staff}</td>
                    <td className="py-3 px-4">{getStatusBadge(appointment.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

