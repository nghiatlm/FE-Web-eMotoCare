import { useState } from "react";
import { Search, Filter, Calendar, Clock, User, Phone, MapPin, Eye, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function AppointmentsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const appointments = [
    {
      id: 1,
      customerName: "Nguyễn Văn A",
      phone: "0901234567",
      email: "nguyenvana@example.com",
      service: "Bảo dưỡng định kỳ",
      date: "2024-01-15",
      time: "09:00",
      staff: "Trần Thị B",
      staffId: "ST-001",
      status: "pending",
      notes: "Khách hàng yêu cầu kiểm tra kỹ hệ thống phanh",
      vehicle: "Xe điện KLARAS",
      address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    },
    {
      id: 2,
      customerName: "Lê Thị C",
      phone: "0907654321",
      email: "lethic@example.com",
      service: "Sửa chữa lốp",
      date: "2024-01-15",
      time: "10:30",
      staff: "Phạm Văn D",
      staffId: "ST-002",
      status: "completed",
      notes: "Đã hoàn thành, khách hàng hài lòng",
      vehicle: "Xe điện KLARAS Pro",
      address: "456 Đường Lê Lợi, Quận 1, TP.HCM",
    },
    {
      id: 3,
      customerName: "Hoàng Văn E",
      phone: "0912345678",
      email: "hoangvane@example.com",
      service: "Thay dầu nhớt",
      date: "2024-01-15",
      time: "14:00",
      staff: "Nguyễn Thị F",
      staffId: "ST-003",
      status: "pending",
      notes: "",
      vehicle: "Xe điện KLARAS",
      address: "789 Đường Pasteur, Quận 3, TP.HCM",
    },
    {
      id: 4,
      customerName: "Đỗ Thị G",
      phone: "0923456789",
      email: "dothig@example.com",
      service: "Kiểm tra tổng thể",
      date: "2024-01-15",
      time: "15:30",
      staff: "Lê Văn H",
      staffId: "ST-004",
      status: "cancelled",
      notes: "Khách hàng hủy do thay đổi lịch trình",
      vehicle: "Xe điện KLARAS Max",
      address: "321 Đường Võ Văn Tần, Quận 3, TP.HCM",
    },
    {
      id: 5,
      customerName: "Phạm Văn I",
      phone: "0934567890",
      email: "phamvani@example.com",
      service: "Thay pin",
      date: "2024-01-16",
      time: "08:00",
      staff: "Trần Thị B",
      staffId: "ST-001",
      status: "pending",
      notes: "Cần chuẩn bị pin mới trước",
      vehicle: "Xe điện KLARAS Pro",
      address: "654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM",
    },
    {
      id: 6,
      customerName: "Võ Thị K",
      phone: "0945678901",
      email: "vothik@example.com",
      service: "Bảo dưỡng định kỳ",
      date: "2024-01-16",
      time: "11:00",
      staff: "Phạm Văn D",
      staffId: "ST-002",
      status: "completed",
      notes: "Đã thay thế một số phụ tùng nhỏ",
      vehicle: "Xe điện KLARAS",
      address: "987 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM",
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.customerName.toLowerCase().includes(search.toLowerCase()) ||
      appointment.phone.includes(search) ||
      appointment.service.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const matchesDate = dateFilter === "all" || appointment.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const uniqueDates = [...new Set(appointments.map((a) => a.date))];

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
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
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
          <CardDescription>Tổng số lịch hẹn: {filteredAppointments.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dịch vụ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ngày/giờ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nhân viên</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-muted-foreground">
                      Không tìm thấy lịch hẹn nào
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">{appointment.customerName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {appointment.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-foreground">{appointment.service}</div>
                          <div className="text-sm text-muted-foreground">{appointment.vehicle}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-foreground">{new Date(appointment.date).toLocaleDateString("vi-VN")}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{appointment.staff}</span>
                        </div>
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
                            console.log("View appointment:", appointment.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

