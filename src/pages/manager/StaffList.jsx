import { useState } from "react";
import { Search, Filter, User, Phone, Mail, MapPin, Eye, Edit, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function StaffList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const staffList = [
    {
      id: "ST-001",
      name: "Trần Thị B",
      phone: "0901111111",
      email: "tranthib@example.com",
      role: "technician",
      roleName: "Kỹ thuật viên",
      status: "active",
      joinDate: "2022-01-15",
      address: "123 Đường A, Quận 1, TP.HCM",
      totalAppointments: 156,
      completedAppointments: 142,
      rating: 4.8,
      specialization: "Bảo dưỡng, Sửa chữa",
    },
    {
      id: "ST-002",
      name: "Phạm Văn D",
      phone: "0902222222",
      email: "phamvand@example.com",
      role: "technician",
      roleName: "Kỹ thuật viên",
      status: "active",
      joinDate: "2022-03-20",
      address: "456 Đường B, Quận 2, TP.HCM",
      totalAppointments: 134,
      completedAppointments: 128,
      rating: 4.6,
      specialization: "Thay thế phụ tùng",
    },
    {
      id: "ST-003",
      name: "Nguyễn Thị F",
      phone: "0903333333",
      email: "nguyenthif@example.com",
      role: "staff",
      roleName: "Nhân viên dịch vụ",
      status: "active",
      joinDate: "2022-05-10",
      address: "789 Đường C, Quận 3, TP.HCM",
      totalAppointments: 98,
      completedAppointments: 95,
      rating: 4.7,
      specialization: "Tiếp đón, Tư vấn",
    },
    {
      id: "ST-004",
      name: "Lê Văn H",
      phone: "0904444444",
      email: "levanh@example.com",
      role: "technician",
      roleName: "Kỹ thuật viên",
      status: "active",
      joinDate: "2022-07-25",
      address: "321 Đường D, Quận 4, TP.HCM",
      totalAppointments: 112,
      completedAppointments: 108,
      rating: 4.5,
      specialization: "Kiểm tra, Chẩn đoán",
    },
    {
      id: "ST-005",
      name: "Võ Thị K",
      phone: "0905555555",
      email: "vothik@example.com",
      role: "staff",
      roleName: "Nhân viên dịch vụ",
      status: "inactive",
      joinDate: "2021-12-01",
      address: "654 Đường E, Quận 5, TP.HCM",
      totalAppointments: 67,
      completedAppointments: 65,
      rating: 4.4,
      specialization: "Tiếp đón, Hỗ trợ",
    },
    {
      id: "ST-006",
      name: "Hoàng Văn M",
      phone: "0906666666",
      email: "hoangvanm@example.com",
      role: "technician",
      roleName: "Kỹ thuật viên",
      status: "active",
      joinDate: "2023-02-14",
      address: "987 Đường F, Quận 6, TP.HCM",
      totalAppointments: 89,
      completedAppointments: 85,
      rating: 4.9,
      specialization: "Bảo dưỡng chuyên sâu",
    },
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

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(search.toLowerCase()) ||
      staff.phone.includes(search) ||
      staff.email.toLowerCase().includes(search.toLowerCase()) ||
      staff.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || staff.status === statusFilter;
    const matchesRole = roleFilter === "all" || staff.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Danh sách Nhân viên</h1>
          <p className="text-muted-foreground">Quản lý nhân viên tại trung tâm dịch vụ</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhân viên
        </Button>
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
                placeholder="Tìm theo tên, số điện thoại, email, mã nhân viên..."
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
                <SelectItem value="active">Đang làm việc</SelectItem>
                <SelectItem value="inactive">Nghỉ việc</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="technician">Kỹ thuật viên</SelectItem>
                <SelectItem value="staff">Nhân viên dịch vụ</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Không tìm thấy nhân viên nào
          </div>
        ) : (
          filteredStaff.map((staff) => (
            <Card key={staff.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{staff.name}</CardTitle>
                      <CardDescription className="mt-1">{staff.id}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(staff.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{staff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground text-xs">{staff.address}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Vai trò</span>
                    {getRoleBadge(staff.role)}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Đánh giá</span>
                    <span className="font-semibold text-foreground">
                      ⭐ {staff.rating} / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lịch hẹn</span>
                    <span className="font-semibold text-foreground">
                      {staff.completedAppointments}/{staff.totalAppointments}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Chuyên môn</p>
                  <p className="text-sm text-foreground">{staff.specialization}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/manager/staff/${staff.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Chi tiết
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

