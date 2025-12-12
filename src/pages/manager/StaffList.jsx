import { useState, useEffect, useMemo } from "react";
import { Search, Filter, User, Phone, Mail, MapPin, Eye, Edit, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId, getStaffsByServiceCenterId } from "@/api/staffsApi";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function StaffList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [staffs, setStaffs] = useState([]);
  const [serviceCenterId, setServiceCenterId] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Get serviceCenterId from staff info
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        // Lưu lại accountId của manager hiện tại để loại khỏi danh sách
        setCurrentAccountId(accountId);

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
          page,
          pageSize,
        });

        const data = response?.data || response;
        setStaffs(data?.rowDatas || []);
        const totalCount = data?.total || data?.data?.total || data?.rowDatas?.length || 0;
        setTotal(totalCount);
      } catch (error) {
        console.error("Error fetching staffs:", error);
        setStaffs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();
  }, [serviceCenterId, page, pageSize]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="inline-flex px-3 py-1 rounded-full text-xs font-medium justify-center bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đang làm việc
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="inline-flex px-3 py-1 rounded-full text-xs font-medium justify-center bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
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

  const transformedStaffs = useMemo(() => {
    return staffs.map((staff) => ({
      id: staff.id,
      staffCode: staff.staffCode || staff.id, 
      name: `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
      avatarUrl: staff.avatarUrl || "",
      phone: staff.account?.phone || staff.phone || "",
      email: staff.account?.email || staff.email || "",
      role: getRoleFromPosition(staff.position),
      roleName: translatePosition(staff.position),
      status: staff.status?.toLowerCase() || "active",
      joinDate: staff.createdAt ? new Date(staff.createdAt).toISOString().split("T")[0] : "",
      address: staff.address || "",
      specialization: translatePosition(staff.position),
      rawData: staff, 
    }));
  }, [staffs]);

  const filteredStaff = transformedStaffs
    .filter((staff) => staff.rawData?.accountId !== currentAccountId)
    .filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(search.toLowerCase()) ||
        staff.phone.includes(search) ||
        staff.email.toLowerCase().includes(search.toLowerCase()) ||
        staff.staffCode.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || staff.status === statusFilter;
      const matchesRole = roleFilter === "all" || staff.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Danh sách nhân viên</h1>
          <p className="text-base md:text-lg font-medium text-slate-700 mt-2">
            Quản lý nhân sự tại trung tâm dịch vụ của bạn
          </p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]" />
        </div>

        <div className="mb-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[260px] md:min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo tên, số điện thoại, email, mã nhân viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang làm việc</SelectItem>
                <SelectItem value="inactive">Nghỉ việc</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="technician">Kỹ thuật viên</SelectItem>
                <SelectItem value="staff">Nhân viên dịch vụ</SelectItem>
                <SelectItem value="storekeeper">Thủ kho</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== "all" || roleFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setRoleFilter("all");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {search || statusFilter !== "all" || roleFilter !== "all"
            ? `Hiển thị ${filteredStaff.length} / ${staffs.length} nhân viên (đã lọc)`
            : `Hiển thị ${staffs.length} / ${total} nhân viên`}
        </p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <div className="min-w-[1100px]">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase w-16">
                    STT
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Mã nhân viên
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Ảnh đại diện
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Họ tên
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Số điện thoại
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Email
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Vai trò
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Trạng thái
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase w-32">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, index) => (
                    <tr
                      key={staff.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-slate-600 text-center">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-center">
                        {staff.staffCode}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-center">
                        <div className="flex items-center justify-center">
                          {staff.avatarUrl ? (
                            <img
                              src={staff.avatarUrl}
                              alt="Ảnh đại diện"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-center">
                        {staff.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800 text-center">
                        {staff.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800 text-center">
                        {staff.email || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800 text-center">
                        {getRoleBadge(staff.role)}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {getStatusBadge(staff.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            onClick={() => navigate(`/manager/staff/${staff.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination – giống style UserTable */}
        {total > 0 && (
          <div className="mt-4 pb-4 flex items-center justify-center text-sm text-slate-500">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className={`cursor-pointer rounded-full px-3 ${
                      page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                    }`}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className={`cursor-pointer rounded-full px-3 py-1 text-sm ${
                        page === pageNum
                          ? "bg-red-100 text-red-700 font-medium"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className={`cursor-pointer rounded-full px-3 ${
                      page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
