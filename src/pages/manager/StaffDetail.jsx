import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, CheckCircle2, XCircle, Star, Award, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - sẽ thay bằng API call sau
  const staffDetail = {
    id: "ST-001",
    name: "Trần Thị B",
    phone: "0901111111",
    email: "tranthib@example.com",
    role: "technician",
    roleName: "Kỹ thuật viên",
    status: "active",
    joinDate: "2022-01-15",
    address: "123 Đường A, Quận 1, TP.HCM",
    dateOfBirth: "1990-05-20",
    gender: "Nữ",
    specialization: "Bảo dưỡng, Sửa chữa",
    totalAppointments: 156,
    completedAppointments: 142,
    cancelledAppointments: 8,
    pendingAppointments: 6,
    rating: 4.8,
    totalReviews: 128,
    salary: "15,000,000 VNĐ",
    department: "Phòng Kỹ thuật",
    certificates: [
      "Chứng chỉ Kỹ thuật viên Bậc 2",
      "Chứng chỉ An toàn lao động",
      "Chứng chỉ Bảo dưỡng Xe điện",
    ],
    skills: [
      "Bảo dưỡng định kỳ",
      "Sửa chữa hệ thống phanh",
      "Thay thế phụ tùng",
      "Kiểm tra điện tử",
      "Chẩn đoán lỗi",
    ],
  };

  const recentAppointments = [
    {
      id: 1,
      customerName: "Nguyễn Văn A",
      service: "Bảo dưỡng định kỳ",
      date: "2024-01-15",
      time: "09:00",
      status: "completed",
      rating: 5,
    },
    {
      id: 2,
      customerName: "Lê Thị C",
      service: "Sửa chữa lốp",
      date: "2024-01-14",
      time: "14:30",
      status: "completed",
      rating: 4,
    },
    {
      id: 3,
      customerName: "Hoàng Văn E",
      service: "Thay dầu nhớt",
      date: "2024-01-13",
      time: "10:00",
      status: "completed",
      rating: 5,
    },
    {
      id: 4,
      customerName: "Đỗ Thị G",
      service: "Kiểm tra tổng thể",
      date: "2024-01-12",
      time: "15:30",
      status: "completed",
      rating: 4,
    },
  ];

  const performanceStats = [
    { label: "Tổng lịch hẹn", value: staffDetail.totalAppointments, color: "text-blue-600" },
    { label: "Hoàn thành", value: staffDetail.completedAppointments, color: "text-green-600" },
    { label: "Đang xử lý", value: staffDetail.pendingAppointments, color: "text-yellow-600" },
    { label: "Đã hủy", value: staffDetail.cancelledAppointments, color: "text-red-600" },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đang làm việc
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Nghỉ việc
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "technician":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Kỹ thuật viên</Badge>;
      case "staff":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Nhân viên dịch vụ</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/manager/staff")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Chi tiết Nhân viên</h1>
        <p className="text-muted-foreground">Thông tin chi tiết về nhân viên</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                {getStatusBadge(staffDetail.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                  <p className="text-lg font-semibold text-foreground mt-1">{staffDetail.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mã nhân viên</label>
                  <p className="text-lg font-semibold text-foreground mt-1">{staffDetail.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{staffDetail.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-foreground mt-1">{staffDetail.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                  <p className="text-foreground mt-1">{new Date(staffDetail.dateOfBirth).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                  <p className="text-foreground mt-1">{staffDetail.gender}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </label>
                <p className="text-foreground mt-1">{staffDetail.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Thông tin công việc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vai trò</label>
                  <div className="mt-1">{getRoleBadge(staffDetail.role)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phòng ban</label>
                  <p className="text-foreground mt-1">{staffDetail.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ngày vào làm
                  </label>
                  <p className="text-foreground mt-1">{new Date(staffDetail.joinDate).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lương</label>
                  <p className="text-foreground font-semibold mt-1">{staffDetail.salary}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Chuyên môn</label>
                <p className="text-foreground mt-1">{staffDetail.specialization}</p>
              </div>
            </CardContent>
          </Card>

          {/* Skills and Certificates */}
          <Tabs defaultValue="skills" className="w-full">
            <TabsList>
              <TabsTrigger value="skills">Kỹ năng</TabsTrigger>
              <TabsTrigger value="certificates">Chứng chỉ</TabsTrigger>
              <TabsTrigger value="appointments">Lịch hẹn gần đây</TabsTrigger>
            </TabsList>
            <TabsContent value="skills" className="space-y-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {staffDetail.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="certificates" className="space-y-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {staffDetail.certificates.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="text-foreground">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="appointments" className="space-y-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{appointment.customerName}</p>
                          <p className="text-sm text-muted-foreground">{appointment.service}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(appointment.date).toLocaleDateString("vi-VN")} - {appointment.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{appointment.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê hiệu suất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-3xl font-bold text-foreground">{staffDetail.rating}</span>
                </div>
                <p className="text-sm text-muted-foreground">Đánh giá trung bình</p>
                <p className="text-xs text-muted-foreground mt-1">({staffDetail.totalReviews} đánh giá)</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                {performanceStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</span>
                  <span className="text-lg font-bold text-green-600">
                    {((staffDetail.completedAppointments / staffDetail.totalAppointments) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa thông tin
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Xem lịch làm việc
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Xem báo cáo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

