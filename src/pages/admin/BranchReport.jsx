import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Download, FileText, Calendar, TrendingUp, BarChart3, PieChart, DollarSign, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServiceCenterById } from "@/api/serviceCentersApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

export default function BranchReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("month");
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranchDetail = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await getServiceCenterById(id);
          if (response.success && response.data) {
            setBranchDetail(response.data);
          }
        } catch (error) {
          console.error("Error fetching branch detail:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBranchDetail();
  }, [id]);

  const revenueData = [
    { month: "Tháng 1", revenue: 125000000, appointments: 45 },
    { month: "Tháng 2", revenue: 138000000, appointments: 52 },
    { month: "Tháng 3", revenue: 152000000, appointments: 58 },
    { month: "Tháng 4", revenue: 145000000, appointments: 55 },
    { month: "Tháng 5", revenue: 168000000, appointments: 62 },
    { month: "Tháng 6", revenue: 175000000, appointments: 68 },
  ];

  const serviceTypeData = [
    { name: "Bảo dưỡng định kỳ", value: 35, color: "#8884d8" },
    { name: "Sửa chữa", value: 28, color: "#82ca9d" },
    { name: "Thay thế phụ tùng", value: 20, color: "#ffc658" },
    { name: "Kiểm tra", value: 17, color: "#ff7300" },
  ];

  const staffPerformanceData = [
    { name: "Trần Thị B", completed: 142, total: 156, rate: 91 },
    { name: "Phạm Văn D", completed: 128, total: 134, rate: 95.5 },
    { name: "Nguyễn Thị F", completed: 95, total: 98, rate: 96.9 },
    { name: "Lê Văn H", completed: 108, total: 112, rate: 96.4 },
    { name: "Hoàng Văn M", completed: 85, total: 89, rate: 95.5 },
  ];

  const warrantyData = [
    { month: "Tháng 1", confirmed: 12, rejected: 3, pending: 5 },
    { month: "Tháng 2", confirmed: 15, rejected: 2, pending: 4 },
    { month: "Tháng 3", confirmed: 18, rejected: 4, pending: 6 },
    { month: "Tháng 4", confirmed: 14, rejected: 3, pending: 5 },
    { month: "Tháng 5", confirmed: 20, rejected: 5, pending: 7 },
    { month: "Tháng 6", confirmed: 22, rejected: 4, pending: 6 },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const summaryStats = {
    totalRevenue: 903000000,
    totalAppointments: 340,
    completedAppointments: 318,
    totalStaff: 24,
    activeStaff: 20,
    totalWarrantyClaims: 86,
    confirmedWarranty: 101,
    averageRating: 4.7,
  };

  const handleExport = (type) => {
    console.log(`Exporting ${type} report`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">Đang tải báo cáo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/admin/branches/${id}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Báo cáo Chi nhánh</h1>
            <p className="text-muted-foreground">
              {branchDetail?.name || "Chi nhánh"} - Báo cáo chi tiết về hoạt động
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="quarter">Quý này</SelectItem>
                <SelectItem value="year">Năm này</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% so với kỳ trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hoàn thành: {summaryStats.completedAppointments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeStaff}/{summaryStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang làm việc / Tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bảo hành</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.confirmedWarranty}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đã xác nhận / Tổng: {summaryStats.totalWarrantyClaims}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Doanh thu và Lịch hẹn theo tháng
          </CardTitle>
          <CardDescription>Biểu đồ doanh thu và số lượng lịch hẹn trong 6 tháng gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "revenue") return formatCurrency(value);
                  return value;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Doanh thu (VNĐ)" />
              <Bar yAxisId="right" dataKey="appointments" fill="#82ca9d" name="Số lịch hẹn" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Phân bố loại dịch vụ
            </CardTitle>
            <CardDescription>Thống kê các loại dịch vụ được sử dụng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Yêu cầu Bảo hành
            </CardTitle>
            <CardDescription>Thống kê yêu cầu bảo hành theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={warrantyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="confirmed" stroke="#82ca9d" name="Đã xác nhận" />
                <Line type="monotone" dataKey="rejected" stroke="#ff7300" name="Đã từ chối" />
                <Line type="monotone" dataKey="pending" stroke="#ffc658" name="Chờ xác nhận" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Hiệu suất Nhân viên
          </CardTitle>
          <CardDescription>Thống kê hiệu suất làm việc của nhân viên</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tên nhân viên</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Hoàn thành</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Tổng số</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Tỷ lệ</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Biểu đồ</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformanceData.map((staff, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-foreground">{staff.name}</div>
                    </td>
                    <td className="py-4 px-4 text-center text-foreground">{staff.completed}</td>
                    <td className="py-4 px-4 text-center text-foreground">{staff.total}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-green-600">{staff.rate}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${staff.rate}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thống kê Dịch vụ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tổng số dịch vụ đã thực hiện</span>
              <span className="font-bold text-foreground text-lg">340</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dịch vụ hoàn thành</span>
              <span className="font-bold text-green-600 text-lg">318</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tỷ lệ hoàn thành</span>
              <span className="font-bold text-foreground text-lg">93.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Đánh giá trung bình</span>
              <span className="font-bold text-yellow-600 text-lg">⭐ {summaryStats.averageRating} / 5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê Bảo hành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tổng yêu cầu bảo hành</span>
              <span className="font-bold text-foreground text-lg">86</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Đã xác nhận</span>
              <span className="font-bold text-green-600 text-lg">101</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Đã từ chối</span>
              <span className="font-bold text-red-600 text-lg">21</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tỷ lệ chấp nhận</span>
              <span className="font-bold text-foreground text-lg">82.8%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

