import { Building2, MapPin, Phone, Mail, Clock, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export default function InformationDetail() {
  const serviceCenterInfo = {
    id: "SC-001",
    name: "GreenWheel - Chi nhánh Hồ Chí Minh",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    phone: "028 3829 1234",
    email: "hcm@greenwheel.com",
    manager: "Nguyễn Văn A",
    managerPhone: "0901234567",
    operatingHours: {
      weekdays: "08:00 - 18:00",
      weekend: "08:00 - 17:00",
    },
    totalStaff: 24,
    activeStaff: 20,
    totalServices: 15,
    status: "active",
    establishedDate: "2020-01-15",
    description: "Trung tâm dịch vụ chính tại thành phố Hồ Chí Minh, chuyên cung cấp các dịch vụ bảo dưỡng và sửa chữa xe điện chất lượng cao.",
  };

  const services = [
    { id: 1, name: "Bảo dưỡng định kỳ", price: "500,000 VNĐ", duration: "2 giờ" },
    { id: 2, name: "Thay dầu nhớt", price: "300,000 VNĐ", duration: "30 phút" },
    { id: 3, name: "Sửa chữa lốp", price: "200,000 VNĐ", duration: "1 giờ" },
    { id: 4, name: "Kiểm tra tổng thể", price: "800,000 VNĐ", duration: "3 giờ" },
    { id: 5, name: "Thay pin", price: "2,000,000 VNĐ", duration: "4 giờ" },
  ];

  const facilities = [
    "Khu vực tiếp đón khách hàng",
    "Xưởng sửa chữa hiện đại",
    "Khu vực bảo quản phụ tùng",
    "Phòng chờ khách hàng",
    "Khu vực rửa xe",
    "Phòng làm việc nhân viên",
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Thông tin Chi tiết Trung tâm</h1>
          <p className="text-muted-foreground">Thông tin chi tiết về trung tâm dịch vụ</p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên trung tâm</label>
                <p className="text-lg font-semibold text-foreground mt-1">{serviceCenterInfo.name}</p>
              </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </label>
                  <p className="text-foreground mt-1">{serviceCenterInfo.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{serviceCenterInfo.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-foreground mt-1">{serviceCenterInfo.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                <p className="text-foreground mt-1">{serviceCenterInfo.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Giờ làm việc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Thứ 2 - Thứ 6</span>
                <span className="font-medium text-foreground">{serviceCenterInfo.operatingHours.weekdays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Thứ 7 - Chủ nhật</span>
                <span className="font-medium text-foreground">{serviceCenterInfo.operatingHours.weekend}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Dịch vụ cung cấp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">Thời gian: {service.duration}</p>
                    </div>
                    <p className="font-semibold text-primary">{service.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiện ích</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                    <span className="text-foreground">{facility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-lg px-4 py-2">
                Đang hoạt động
              </Badge>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày thành lập</span>
                  <span className="text-foreground font-medium">{serviceCenterInfo.establishedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã trung tâm</span>
                  <span className="text-foreground font-medium">{serviceCenterInfo.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Quản lý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên quản lý</label>
                <p className="text-foreground font-semibold mt-1">{serviceCenterInfo.manager}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                <p className="text-foreground mt-1">{serviceCenterInfo.managerPhone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tổng nhân viên</span>
                <span className="text-2xl font-bold text-foreground">{serviceCenterInfo.totalStaff}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nhân viên đang làm việc</span>
                <span className="text-2xl font-bold text-green-600">{serviceCenterInfo.activeStaff}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tổng dịch vụ</span>
                <span className="text-2xl font-bold text-primary">{serviceCenterInfo.totalServices}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

