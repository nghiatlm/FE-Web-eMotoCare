import { useState } from "react";
import { Search, Filter, FileText, Calendar, User, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function WarrantyList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");

  const warrantyClaims = [
    {
      id: "WC-001",
      deviceModel: "KLARAS",
      serialNumber: "SN-2024-001",
      issueDescription: "Pin không sạc được, màn hình hiển thị lỗi",
      submittedDate: "2024-01-10",
      ownerName: "Nguyễn Văn A",
      ownerPhone: "0901234567",
      ownerEmail: "nguyenvana@example.com",
      status: "pending",
      purchaseDate: "2023-06-15",
      warrantyExpiryDate: "2024-06-15",
      serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
      notes: "Khách hàng phàn nàn về việc pin không sạc được sau 6 tháng sử dụng",
      priority: "high",
    },
    {
      id: "WC-002",
      deviceModel: "KLARAS Pro",
      serialNumber: "SN-2024-002",
      issueDescription: "Lốp xe bị thủng, cần thay thế",
      submittedDate: "2024-01-12",
      ownerName: "Lê Thị B",
      ownerPhone: "0907654321",
      ownerEmail: "lethib@example.com",
      status: "confirmed",
      purchaseDate: "2023-08-20",
      warrantyExpiryDate: "2024-08-20",
      serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
      notes: "Lốp bị thủng do va chạm, cần kiểm tra xem có thuộc phạm vi bảo hành",
      priority: "medium",
      confirmedDate: "2024-01-13",
      confirmedBy: "Nguyễn Văn Manager",
    },
    {
      id: "WC-003",
      deviceModel: "KLARAS",
      serialNumber: "SN-2024-003",
      issueDescription: "Hệ thống phanh không hoạt động tốt",
      submittedDate: "2024-01-14",
      ownerName: "Hoàng Văn C",
      ownerPhone: "0912345678",
      ownerEmail: "hoangvanc@example.com",
      status: "rejected",
      purchaseDate: "2022-12-10",
      warrantyExpiryDate: "2023-12-10",
      serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
      notes: "Hết hạn bảo hành, không thể xử lý theo chính sách bảo hành",
      priority: "low",
      rejectedDate: "2024-01-14",
      rejectedBy: "Nguyễn Văn Manager",
      rejectionReason: "Sản phẩm đã hết hạn bảo hành",
    },
    {
      id: "WC-004",
      deviceModel: "KLARAS Max",
      serialNumber: "SN-2024-004",
      issueDescription: "Màn hình bị vỡ, cần thay thế",
      submittedDate: "2024-01-15",
      ownerName: "Đỗ Thị D",
      ownerPhone: "0923456789",
      ownerEmail: "dothid@example.com",
      status: "pending",
      purchaseDate: "2023-09-05",
      warrantyExpiryDate: "2024-09-05",
      serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
      notes: "Màn hình bị vỡ do va chạm, cần kiểm tra xem có thuộc phạm vi bảo hành",
      priority: "high",
    },
    {
      id: "WC-005",
      deviceModel: "KLARAS Pro",
      serialNumber: "SN-2024-005",
      issueDescription: "Động cơ phát ra tiếng ồn bất thường",
      submittedDate: "2024-01-16",
      ownerName: "Phạm Văn E",
      ownerPhone: "0934567890",
      ownerEmail: "phamvane@example.com",
      status: "confirmed",
      purchaseDate: "2023-07-12",
      warrantyExpiryDate: "2024-07-12",
      serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
      notes: "Động cơ có vấn đề, cần kiểm tra và sửa chữa",
      priority: "high",
      confirmedDate: "2024-01-16",
      confirmedBy: "Nguyễn Văn Manager",
    },
    {
      id: "WC-006",
      deviceModel: "KLARAS",
      serialNumber: "SN-2024-006",
      issueDescription: "Bộ sạc không hoạt động",
      submittedDate: "2024-01-17",
      ownerName: "Võ Thị F",
      ownerPhone: "0945678901",
      ownerEmail: "vothif@example.com",
      status: "pending",
      purchaseDate: "2023-10-01",
      warrantyExpiryDate: "2024-10-01",
      serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
      notes: "Bộ sạc bị hỏng, cần thay thế",
      priority: "medium",
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Chờ xác nhận
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đã xác nhận
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Đã từ chối
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ưu tiên cao</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ưu tiên trung bình</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Ưu tiên thấp</Badge>;
      default:
        return null;
    }
  };

  const filteredClaims = warrantyClaims.filter((claim) => {
    const matchesSearch =
      claim.id.toLowerCase().includes(search.toLowerCase()) ||
      claim.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      claim.ownerPhone.includes(search) ||
      claim.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      claim.issueDescription.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesDevice = deviceFilter === "all" || claim.deviceModel === deviceFilter;
    return matchesSearch && matchesStatus && matchesDevice;
  });

  const stats = {
    total: warrantyClaims.length,
    pending: warrantyClaims.filter((c) => c.status === "pending").length,
    confirmed: warrantyClaims.filter((c) => c.status === "confirmed").length,
    rejected: warrantyClaims.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Bảo hành</h1>
        <p className="text-muted-foreground">Quản lý các yêu cầu bảo hành tại trung tâm dịch vụ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
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
                placeholder="Tìm theo mã, tên khách hàng, SĐT, số serial..."
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
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại xe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="KLARAS">KLARAS</SelectItem>
                <SelectItem value="KLARAS Pro">KLARAS Pro</SelectItem>
                <SelectItem value="KLARAS Max">KLARAS Max</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warranty Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu bảo hành ({filteredClaims.length})</CardTitle>
          <CardDescription>Tổng số yêu cầu: {filteredClaims.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã yêu cầu</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sản phẩm</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vấn đề</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ngày gửi</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ưu tiên</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-muted-foreground">
                      Không tìm thấy yêu cầu bảo hành nào
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-foreground">{claim.id}</div>
                        <div className="text-sm text-muted-foreground">SN: {claim.serialNumber}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">{claim.ownerName}</div>
                          <div className="text-sm text-muted-foreground">{claim.ownerPhone}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-foreground">{claim.deviceModel}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="max-w-xs">
                          <div className="text-foreground text-sm truncate" title={claim.issueDescription}>
                            {claim.issueDescription}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{new Date(claim.submittedDate).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getPriorityBadge(claim.priority)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(claim.status)}
                          {getStatusBadge(claim.status)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/manager/warranty/${claim.id}`)}
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

