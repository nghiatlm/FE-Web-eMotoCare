import { useState, useEffect, useMemo } from "react";
import { Search, Filter, FileText, Calendar, User, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getRmas } from "@/api/rmasApi";
import { getStaffByAccountId } from "@/api/staffsApi";
import { useAuth } from "@/contexts/AuthContext";

export default function WarrantyList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rmas, setRmas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [serviceCenterId, setServiceCenterId] = useState(null);

  useEffect(() => {
    const fetchServiceCenterId = async () => {
      const accountId = user?.accountResponse?.id;
      if (!accountId) return;
      try {
        const response = await getStaffByAccountId(accountId);
        const staffData = response?.data?.rowDatas?.[0];
        if (staffData?.serviceCenterId) {
          setServiceCenterId(staffData.serviceCenterId);
        }
      } catch (error) {
        console.error("Error fetching service center ID:", error);
      }
    };
    if (user) {
      fetchServiceCenterId();
    }
  }, [user]);

  useEffect(() => {
    const fetchRmas = async () => {
      if (!serviceCenterId) return;
      setLoading(true);
      try {
        const params = {
          page,
          pageSize,
          ...(search && { search }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          serviceCenterId,
        };
        const response = await getRmas(params);
        if (response?.data) {
          setRmas(response.data.rowDatas || []);
          setTotal(response.data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching RMAs:", error);
        setRmas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRmas();
  }, [serviceCenterId, page, pageSize, search, statusFilter]);


  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Chờ xác nhận
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Đang xử lý
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Đã duyệt
          </Badge>
        );
      case "REJECTED":
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
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const transformedRmas = useMemo(() => {
    return rmas.map((rma) => ({
      id: rma.id,
      code: rma.code,
      rmaDate: rma.rmaDate,
      status: rma.status,
      note: rma.note || "",
      returnAddress: rma.returnAddress || "",
      staffName: rma.staff
        ? `${rma.staff.firstName || ""} ${rma.staff.lastName || ""}`.trim()
        : "",
      staffCode: rma.staff?.staffCode || "",
      staffPhone: rma.staff?.phone || "",
    }));
  }, [rmas]);

  const filteredClaims = useMemo(() => {
    return transformedRmas.filter((claim) => {
      const matchesSearch =
        !search ||
        claim.code.toLowerCase().includes(search.toLowerCase()) ||
        claim.staffName.toLowerCase().includes(search.toLowerCase()) ||
        claim.staffCode.toLowerCase().includes(search.toLowerCase()) ||
        claim.note.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || claim.status?.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [transformedRmas, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: rmas.length,
      pending: rmas.filter((c) => c.status?.toUpperCase() === "PENDING").length,
      approved: rmas.filter((c) => c.status?.toUpperCase() === "APPROVED").length,
      rejected: rmas.filter((c) => c.status?.toUpperCase() === "REJECTED").length,
    };
  }, [rmas]);

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
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
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
                <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
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
            <CardDescription>Tổng số yêu cầu: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã yêu cầu</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nhân viên</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ghi chú</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Địa chỉ trả</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ngày gửi</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-muted-foreground">
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
                            <div className="font-medium text-foreground">{claim.code}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-foreground">{claim.staffName || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">{claim.staffCode || ""}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="max-w-xs">
                              <div className="text-foreground text-sm truncate" title={claim.note}>
                                {claim.note || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="max-w-xs">
                              <div className="text-foreground text-sm truncate" title={claim.returnAddress}>
                                {claim.returnAddress || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">
                                {claim.rmaDate
                                  ? new Date(claim.rmaDate).toLocaleDateString("vi-VN")
                                  : "—"}
                              </span>
                            </div>
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
            )}
            {total > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} của {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= total}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

