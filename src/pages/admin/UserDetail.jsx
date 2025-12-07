import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  Shield,
  Building2,
  Briefcase,
  UserCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/api/usersApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userDetail, setUserDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Gọi API get all với pageSize lớn để lấy tất cả users
        const response = await getUsers(1, 1000);
        const data = response?.data || response;
        const users = data?.rowDatas || data?.data || [];
        
        // Tìm user theo id
        const foundUser = users.find((user) => user.id === id);
        
        if (foundUser) {
          setUserDetail(foundUser);
        } else {
          setError("Không tìm thấy người dùng");
        }
      } catch (err) {
        console.error("Error fetching user detail:", err);
        setError("Không thể tải thông tin người dùng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  // Translate role to Vietnamese
  const translateRole = (role) => {
    switch (role) {
      case "ROLE_ADMIN":
        return "Quản trị viên";
      case "ROLE_MANAGER":
        return "Quản lý";
      case "ROLE_STAFF":
        return "Nhân viên dịch vụ";
      case "ROLE_TECHNICIAN":
        return "Kỹ thuật viên";
      case "ROLE_STOREKEEPER":
        return "Thủ kho";
      case "ROLE_CUSTOMER":
        return "Khách hàng";
      default:
        return role || "—";
    }
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
        return position || "—";
    }
  };

  // Translate gender to Vietnamese
  const translateGender = (gender) => {
    switch (gender) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      default:
        return gender || "—";
    }
  };

  // Translate status to Vietnamese
  const translateStatus = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Đang hoạt động";
      case "INACTIVE":
      case "IN_ACTIVE":
        return "Không hoạt động";
      default:
        return status || "—";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Button variant="ghost" onClick={() => navigate("/admin/users")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || "Không tìm thấy thông tin người dùng"}</p>
            <Button className="mt-4" onClick={() => navigate("/admin/users")}>
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const staff = userDetail.staff;
  const customer = userDetail.customer;
  const serviceCenter = staff?.serviceCenter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin/users")} 
              className="mb-2 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Chi tiết người dùng</h1>
              <p className="text-muted-foreground mt-1">Thông tin chi tiết về tài khoản người dùng</p>
            </div>
          </div>
          <Badge
            className={
              userDetail.status === "ACTIVE"
                ? "bg-green-100 text-green-800 hover:bg-green-100 text-sm px-4 py-2"
                : "bg-red-100 text-red-800 hover:bg-red-100 text-sm px-4 py-2"
            }
          >
            {translateStatus(userDetail.status)}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin tài khoản */}
          <Card className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                Thông tin tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vai trò</p>
                </div>
                <p className="text-base font-bold text-foreground">{translateRole(userDetail.roleName)}</p>
              </div>

              {userDetail.phone && (
                <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
                  </div>
                  <p className="text-base font-bold text-foreground">{userDetail.phone}</p>
                </div>
              )}

              {userDetail.email && (
                <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                  </div>
                  <p className="text-base font-bold text-foreground break-words">{userDetail.email}</p>
                </div>
              )}

              <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={`h-4 w-4 ${userDetail.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                </div>
                <p className="text-base font-bold text-foreground">{translateStatus(userDetail.status)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin nhân viên (nếu có) */}
          {staff && (
            <Card className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shadow-sm">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  Thông tin nhân viên
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <IdCard className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mã nhân viên</p>
                    </div>
                    <p className="text-base font-bold text-foreground">{staff.staffCode || "—"}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Họ và tên</p>
                    </div>
                    <p className="text-base font-bold text-foreground">
                      {`${staff.firstName || ""} ${staff.lastName || ""}`.trim() || "—"}
                    </p>
                  </div>

                  {staff.citizenId && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <IdCard className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CMND/CCCD</p>
                      </div>
                      <p className="text-base font-bold text-foreground font-mono">{staff.citizenId}</p>
                    </div>
                  )}

                  {staff.dateOfBirth && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ngày sinh</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{formatDate(staff.dateOfBirth)}</p>
                    </div>
                  )}

                  {staff.gender && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCircle className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giới tính</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{translateGender(staff.gender)}</p>
                    </div>
                  )}

                  {staff.address && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ</p>
                      </div>
                      <p className="text-base font-bold text-foreground break-words">{staff.address}</p>
                    </div>
                  )}

                  {staff.position && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chức vụ</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{translatePosition(staff.position)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thông tin khách hàng (nếu có) */}
          {customer && (
            <Card className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shadow-sm">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <IdCard className="h-4 w-4 text-purple-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mã khách hàng</p>
                    </div>
                    <p className="text-base font-bold text-foreground">{customer.customerCode || "—"}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Họ và tên</p>
                    </div>
                    <p className="text-base font-bold text-foreground">
                      {`${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "—"}
                    </p>
                  </div>

                  {customer.citizenId && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <IdCard className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CMND/CCCD</p>
                      </div>
                      <p className="text-base font-bold text-foreground font-mono">{customer.citizenId}</p>
                    </div>
                  )}

                  {customer.dateOfBirth && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ngày sinh</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{formatDate(customer.dateOfBirth)}</p>
                    </div>
                  )}

                  {customer.gender && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCircle className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giới tính</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{translateGender(customer.gender)}</p>
                    </div>
                  )}

                  {customer.address && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ</p>
                      </div>
                      <p className="text-base font-bold text-foreground break-words">{customer.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thông tin chi nhánh (nếu có) */}
          {serviceCenter && (
            <Card className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-lg overflow-hidden hover:shadow-xl transition-shadow md:col-span-2">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  Thông tin chi nhánh
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tên chi nhánh</p>
                    </div>
                    <p className="text-base font-bold text-foreground">{serviceCenter.name || "—"}</p>
                  </div>

                  {serviceCenter.code && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <IdCard className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mã chi nhánh</p>
                      </div>
                      <p className="text-base font-bold text-foreground font-mono">{serviceCenter.code}</p>
                    </div>
                  )}

                  {serviceCenter.phone && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
                      </div>
                      <p className="text-base font-bold text-foreground">{serviceCenter.phone}</p>
                    </div>
                  )}

                  {serviceCenter.email && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                      </div>
                      <p className="text-base font-bold text-foreground break-words">{serviceCenter.email}</p>
                    </div>
                  )}

                  {serviceCenter.address && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ</p>
                      </div>
                      <p className="text-base font-bold text-foreground break-words">{serviceCenter.address}</p>
                    </div>
                  )}

                  {serviceCenter.description && (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mô tả</p>
                      </div>
                      <p className="text-base font-semibold text-foreground leading-relaxed">{serviceCenter.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

