import { useState, useEffect, useMemo } from "react";
import { Search, Filter, FileText, Calendar, User, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getRmas } from "@/api/rmasApi";
import { getStaffByAccountId } from "@/api/staffsApi";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
          <Badge className="inline-flex px-3 py-1 rounded-full text-xs font-medium justify-center bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
            Chờ xác nhận
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="inline-flex px-3 py-1 rounded-full text-xs font-medium justify-center bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
            Đang xử lý
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            Đã duyệt
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
            Đã từ chối
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 flex items-center gap-1">
            Đã hủy
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1">
            Hoàn thành
          </Badge>
        );
      case "APPOINTMENT_BOOKED":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
            Đã đặt lịch
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Quản lý bảo hành</h1>
          <p className="text-base md:text-lg font-medium text-slate-700 mt-2">
            Quản lý các yêu cầu bảo hành tại trung tâm dịch vụ
          </p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tổng số</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Chờ xác nhận</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Đã duyệt</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Đã từ chối</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
        </div>

        {/* Filters – giống block filter admin */}
        <div className="mb-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[260px] md:min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã yêu cầu, nhân viên, ghi chú..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Trạng thái
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setPage(1);
                    setStatusFilter(value);
                  }}
                >
                  <SelectTrigger className="w-[150px] md:w-[180px] h-9 text-sm bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                    <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                    <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                    <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                    <SelectItem value="CANCELED">Đã hủy</SelectItem>
                    <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                    <SelectItem value="APPOINTMENT_BOOKED">Đã đặt lịch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {search || statusFilter !== "all"
            ? `Hiển thị ${filteredClaims.length} / ${rmas.length} yêu cầu (đã lọc)`
            : `Hiển thị ${rmas.length} / ${total} yêu cầu`}
        </p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <div className="min-w-[1100px]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                  <th className="text-center py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase w-16">
                    STT
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Mã yêu cầu
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Nhân viên
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Địa chỉ trả
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
                    Ngày gửi
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wide text-red-700 uppercase">
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
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground text-sm">
                      Không tìm thấy yêu cầu bảo hành nào
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim, index) => (
                    <tr
                      key={claim.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      <td className="py-3 px-4 text-sm text-slate-600 text-center">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {claim.code}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        <div>
                          <div className="font-medium text-slate-900">
                            {claim.staffName || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">{claim.staffCode || ""}</div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4 text-sm text-slate-900">
                        <div className="max-w-xs">
                          <div className="truncate" title={claim.returnAddress}>
                            {claim.returnAddress || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>
                            {claim.rmaDate
                              ? new Date(claim.rmaDate).toLocaleDateString("vi-VN")
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(claim.status)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            onClick={() => navigate(`/manager/warranty/${claim.id}`)}
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

