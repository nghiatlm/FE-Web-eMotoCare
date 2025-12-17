import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, CheckCircle2, XCircle, Star, Award, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStaffById } from "@/api/staffsApi";

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staffDetail, setStaffDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaffDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getStaffById(id);
        const data = response?.data || response;
        setStaffDetail(data);
      } catch (err) {
        console.error("Error fetching staff detail:", err);
        setError("Không thể tải thông tin nhân viên. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStaffDetail();
    }
  }, [id]);

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

  if (error || !staffDetail) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error || "Không tìm thấy thông tin nhân viên"}</p>
            <Button className="w-full mt-4" onClick={() => navigate("/manager/staff")}>
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const transformedStaff = {
    id: staffDetail.staffCode || staffDetail.id,
    name: `${staffDetail.firstName || ""} ${staffDetail.lastName || ""}`.trim(),
    phone: staffDetail.account.phone || "",
    email: staffDetail.account.email || "",
    role: staffDetail.position?.includes("TECHNICIAN") ? "technician" :
          staffDetail.position?.includes("SERVICE_STAFF") ? "staff" :
          staffDetail.position?.includes("STORE_KEEPER") ? "storekeeper" :
          staffDetail.position?.includes("MANAGER") ? "manager" : "other",
    roleName: translatePosition(staffDetail.position),
    status: staffDetail.status?.toLowerCase() || "active",
    joinDate: staffDetail.createdAt || "",
    address: staffDetail.address || "",
    dateOfBirth: staffDetail.dateOfBirth || "",
    gender: translateGender(staffDetail.gender),
    specialization: translatePosition(staffDetail.position),
    citizenId: staffDetail.citizenId || "",
    serviceCenter: staffDetail.serviceCenter || null,
  };

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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                {getStatusBadge(transformedStaff.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                  <p className="text-lg font-semibold text-foreground mt-1">{transformedStaff.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mã nhân viên</label>
                  <p className="text-lg font-semibold text-foreground mt-1">{transformedStaff.id || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{transformedStaff.phone || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-foreground mt-1">{transformedStaff.email || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                  <p className="text-foreground mt-1">
                    {transformedStaff.dateOfBirth 
                      ? new Date(transformedStaff.dateOfBirth).toLocaleDateString("vi-VN")
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                  <p className="text-foreground mt-1">{transformedStaff.gender || "—"}</p>
                </div>
              </div>
              {transformedStaff.citizenId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CMND/CCCD</label>
                  <p className="text-foreground mt-1">{transformedStaff.citizenId}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </label>
                <p className="text-foreground mt-1">{transformedStaff.address || "—"}</p>
              </div>
            </CardContent>
          </Card>

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
                  <div className="mt-1">{getRoleBadge(transformedStaff.role)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Chi nhánh
                  </label>
                  <p className="text-foreground mt-1">
                    {transformedStaff.serviceCenter?.name || transformedStaff.serviceCenter?.code || "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ngày vào làm
                  </label>
                  <p className="text-foreground mt-1">
                    {transformedStaff.joinDate 
                      ? new Date(transformedStaff.joinDate).toLocaleDateString("vi-VN")
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Chuyên môn</label>
                  <p className="text-foreground mt-1">{transformedStaff.specialization || "—"}</p>
                </div>
              </div>
              {transformedStaff.serviceCenter?.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ chi nhánh
                  </label>
                  <p className="text-foreground mt-1">{transformedStaff.serviceCenter.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6 sticky top-20 self-start">
          {transformedStaff.serviceCenter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Chi nhánh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên chi nhánh</label>
                  <p className="text-foreground font-semibold mt-1">
                    {transformedStaff.serviceCenter.name || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mã chi nhánh</label>
                  <p className="text-foreground mt-1">
                    {transformedStaff.serviceCenter.code || "—"}
                  </p>
                </div>
                {transformedStaff.serviceCenter.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Số điện thoại
                    </label>
                    <p className="text-foreground mt-1">{transformedStaff.serviceCenter.phone}</p>
                  </div>
                )}
                {transformedStaff.serviceCenter.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-foreground mt-1">{transformedStaff.serviceCenter.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


