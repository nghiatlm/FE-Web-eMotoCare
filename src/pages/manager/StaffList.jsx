import { useState, useEffect, useMemo } from "react";
import { Search, Filter, User, Phone, Mail, MapPin, Eye, Edit, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId, getStaffsByServiceCenterId } from "@/api/staffsApi";

export default function StaffList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [staffs, setStaffs] = useState([]);
  const [serviceCenterId, setServiceCenterId] = useState(null);

  // Get serviceCenterId from staff info
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (staffData?.serviceCenterId) {
          setServiceCenterId(staffData.serviceCenterId);
        }
      } catch (error) {
        console.error("Error fetching staff info:", error);
      }
    };

    if (user) {
      fetchStaffInfo();
    }
  }, [user]);

  // Fetch staffs by serviceCenterId
  useEffect(() => {
    if (!serviceCenterId) return;

    const fetchStaffs = async () => {
      try {
        setLoading(true);
        const response = await getStaffsByServiceCenterId(serviceCenterId, {
          page: 1,
          pageSize: 100,
        });

        const data = response?.data || response;
        setStaffs(data?.rowDatas || []);
      } catch (error) {
        console.error("Error fetching staffs:", error);
        setStaffs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();
  }, [serviceCenterId]);

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
      case "storekeeper":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Thủ kho</Badge>;
      case "manager":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Quản lý chi nhánh</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  // Map position to role
  const getRoleFromPosition = (position) => {
    if (position?.includes("TECHNICIAN")) return "technician";
    if (position?.includes("SERVICE_STAFF") || position?.includes("STAFF")) return "staff";
    if (position?.includes("STORE_KEEPER")) return "storekeeper";
    if (position?.includes("MANAGER")) return "manager";
    return "other";
  };

  // Translate position to Vietnamese
  const translatePosition = (position) => {
    switch (position) {
      case "TECHNICIAN_STAFF":
        return "Kỹ thuật viên";
      case "SERVICE_STAFF":
        return "Nhân viên dịch vụ";
      case "STORE_KEEPER":
        return "Thủ kho";
      case "MANAGER_BRANCH":
        return "Quản lý chi nhánh";
      default:
        return position || "Khác";
    }
  };

  // Transform API data to UI format
  const transformedStaffs = useMemo(() => {
    return staffs.map((staff) => ({
      id: staff.id, // Use real UUID id for API calls
      staffCode: staff.staffCode || staff.id, // Use staffCode for display
      name: `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
      phone: staff.phone || "",
      email: staff.email || "",
      role: getRoleFromPosition(staff.position),
      roleName: translatePosition(staff.position),
      status: staff.status?.toLowerCase() || "active",
      joinDate: staff.createdAt ? new Date(staff.createdAt).toISOString().split("T")[0] : "",
      address: staff.address || "",
      specialization: translatePosition(staff.position),
      rawData: staff, // Keep raw data for detail page
    }));
  }, [staffs]);

  const filteredStaff = transformedStaffs.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(search.toLowerCase()) ||
      staff.phone.includes(search) ||
      staff.email.toLowerCase().includes(search.toLowerCase()) ||
      staff.staffCode.toLowerCase().includes(search.toLowerCase());
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
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span>Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : filteredStaff.length === 0 ? (
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
                      <CardDescription className="mt-1">{staff.staffCode}</CardDescription>
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

