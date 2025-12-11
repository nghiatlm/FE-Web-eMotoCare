import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Megaphone, Eye, Edit, Trash2, Calendar, RefreshCw, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Spin, DatePicker } from "antd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent} from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "react-toastify";
import { syncCampaignsData } from "@/api/campaignsApi";
import { getPrograms } from "../../services/programService";


const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Đang diễn ra",
    UPCOMING: "Sắp diễn ra",
    ENDED: "Đã kết thúc",
    CANCELLED: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    UPCOMING: "bg-blue-100 text-blue-700 border-blue-200",
    ENDED: "bg-slate-100 text-slate-700 border-slate-300",
    CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return classMap[status] || "bg-muted text-muted-foreground border-border";
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [dateRange, setDateRange] = useState([null, null]);
  const [typeFilter, setTypeFilter] = useState("");
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, [])

  const fetchCampaigns = async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    const params = {
      pageCurrent: page,
      pageSize: pageSize,
    };
    if (search) params.query = search;
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    if (modelId) params.modelId = modelId;
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format ? dateRange[0].format("YYYY-MM-DD") : dateRange[0];
      params.endDate = dateRange[1].format ? dateRange[1].format("YYYY-MM-DD") : dateRange[1];
    }
    try {
      const res = await getPrograms(params);
      console.log("Fetched campaigns:", res);

      let rows = [];
      if (Array.isArray(res)) rows = res;
      else if (Array.isArray(res?.data)) rows = res.data;
      else if (Array.isArray(res?.items)) rows = res.items;
      else if (Array.isArray(res?.rows)) rows = res.rows;
      else if (Array.isArray(res?.data?.data)) rows = res.data.data;
      else if (res?.data?.data?.rowDatas) rows = res.data.data.rowDatas;
      else if (res?.data?.rowDatas) rows = res.data.rowDatas;
      else if (res?.data) rows = Array.isArray(res.data) ? res.data : [];
      else rows = [];

      const total = res?.total || res?.data?.total || res?.meta?.total || res?.data?.data?.total || rows.length;

      setCampaigns(rows);
      setPagination((p) => ({ ...p, current: page, pageSize, total: Number(total || rows.length) }));
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(err?.message || String(err));
      setCampaigns([]);
      setPagination((p) => ({ ...p, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (statusFilter !== "all" && campaign.status !== statusFilter) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(campaign.id || campaign.code || campaign.programCode || "").toLowerCase().includes(q) ||
        String(campaign.name || campaign.title || campaign.programName || "").toLowerCase().includes(q) ||
        String(campaign.description || campaign.note || "").toLowerCase().includes(q)
      );
    });
  }, [campaigns, search, statusFilter]);

  const headerCellStyle = {
    background: "linear-gradient(90deg, #fff7f7 0%, #ffeaea 100%)", 
    color: "#b91c1c",
    fontWeight: 700,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
    borderBottom: "1px solid #fecdd3",
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, record, idx) => (
        <span className="font-bold text-primary text-sm">{(pagination.current - 1) * pagination.pageSize + idx + 1}</span>
      ),
      width: 80,
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Tên chiến dịch",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div className="space-y-1 max-w-xs">
          <div className="font-semibold text-slate-900 text-sm leading-tight">{record.name || record.title}</div>
          <div className="text-xs text-slate-500 font-medium line-clamp-1">{record.description}</div>
        </div>
      ),
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      render: (_, record) => <div className="text-center text-sm">{formatDate(record.startDate)}</div>,
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Thời gian kết thúc",
      dataIndex: "endDate",
      key: "endDate",
      render: (_, record) => <div className="text-center text-sm">{formatDate(record.endDate)}</div>,
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (_, record) => (
        <div className="flex items-center justify-center">
          <span className={`px-3 py-1.5 rounded-md font-semibold text-xs border shadow-sm ${getStatusBadgeClass(record.status)}`}>
            {getStatusLabel(record.status)}
          </span>
        </div>
      ),
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:bg-primary/10"
            title="Xem chi tiết"
            onClick={() => navigate(`/admin/campaigns/${record.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" title="Chỉnh sửa">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Xóa">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
  ];

  const onPageChange = (page, pageSize) => {
    fetchCampaigns(page, pageSize);
  };

  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | success | error
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleSyncCampaigns = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus("syncing");
    try {
      const res = await syncCampaignsData();
      const ok =
        res?.success === true ||
        res?.statusCode === 200 ||
        res?.data?.success === true ||
        res?.data?.statusCode === 200;
      if (ok) {
        setSyncStatus("success");
        setLastSync(new Date().toISOString());
        toast.success("Đồng bộ chiến dịch thành công");
        // refresh list after sync
        fetchCampaigns(pagination.current, pagination.pageSize);
      } else {
        setSyncStatus("error");
        toast.error("Đồng bộ không thành công. Vui lòng thử lại.");
      }
    } catch (err) {
      setSyncStatus("error");
      toast.error("Đồng bộ thất bại. Vui lòng thử lại.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-red-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Danh sách chiến dịch</h1>
          </div>
          <p className="text-base md:text-lg font-medium text-slate-700">Quản lý các chiến dịch khuyến mãi và ưu đãi</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]" />
        </div>

        {/* Sync card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Chiến dịch</h3>
                  <p className="text-sm text-slate-600">
                    Đồng bộ dữ liệu chiến dịch và chương trình từ hệ thống OEM
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {syncStatus === "success" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã đồng bộ
                      </span>
                    )}
                    {syncStatus === "error" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Lỗi đồng bộ
                      </span>
                    )}
                    {syncStatus === "syncing" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang đồng bộ
                      </span>
                    )}
                    {syncStatus === "idle" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                        <Clock className="h-3.5 w-3.5" />
                        Chưa đồng bộ
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      Lần gần nhất: {formatDateTime(lastSync)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:ml-auto flex-shrink-0 w-full md:w-auto">
                <Button
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 gap-2 px-6"
                  onClick={handleSyncCampaigns}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Đồng bộ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px] md:min-w-[320px] md:max-w-[420px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo mã, tên hoặc mô tả"
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
                  <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
                  <SelectItem value="ENDED">Đã kết thúc</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateRange([null, null]);
                  setTypeFilter("");
                  setModelId("");
                  fetchCampaigns(1, pagination.pageSize);
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                Xóa lọc
              </Button>
              <Button
                className="gap-2 ml-auto bg-red-600 hover:bg-red-700 shadow-sm"
                size="sm"
                onClick={() => navigate("/admin/campaigns/new")}
              >
                <Plus className="h-4 w-4" />
                Tạo chiến dịch mới
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '260px' }} />
                  <col style={{ width: '260px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '140px' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                    <th className="text-center py-4 px-4 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">STT</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Tên chiến dịch</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Mô tả</th>
                    <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Thời gian bắt đầu</th>
                    <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Thời gian kết thúc</th>
                    <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Trạng thái</th>
                    <th className="text-center py-4 px-6 text-xs font-semibold text-red-700 uppercase tracking-wide whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '260px' }} />
                  <col style={{ width: '260px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '140px' }} />
                </colgroup>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-16 px-6 text-center">
                        <Spin />
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 px-6 text-center text-slate-500 text-sm">
                        {error ? `Lỗi: ${error}` : "Không tìm thấy chiến dịch"}
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((record, idx) => (
                      <tr
                        key={record.id || record.code || idx}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                        }`}
                      >
                        <td className="py-4 px-4 text-center text-sm font-medium text-slate-600 align-top whitespace-nowrap">
                          {(pagination.current - 1) * pagination.pageSize + idx + 1}
                        </td>
                        <td className="py-4 px-6 align-top">
                          <div className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1 max-w-[240px]">
                            {record.name || record.title || "—"}
                          </div>
                        </td>
                        <td className="py-4 px-6 align-top">
                          <div className="text-sm text-slate-700 line-clamp-1 max-w-[240px]">
                            {record.description || record.note || "—"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-slate-700 whitespace-nowrap align-top">
                          {formatDate(record.startDate)}
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-slate-700 whitespace-nowrap align-top">
                          {formatDate(record.endDate)}
                        </td>
                        <td className="py-4 px-4 text-center align-top whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <span className={`px-3 py-1.5 rounded-md font-semibold text-xs border shadow-sm ${getStatusBadgeClass(record.status)}`}>
                              {getStatusLabel(record.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center align-top whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              title="Xem chi tiết"
                              onClick={() => navigate(`/admin/campaigns/${record.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" title="Chỉnh sửa">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 flex justify-center">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => onPageChange(Math.max(1, pagination.current - 1), pagination.pageSize)}
                      className={`h-8 px-2.5 text-xs cursor-pointer rounded-full ${
                        pagination.current === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"
                      }`}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNum, pagination.pageSize)}
                        isActive={pagination.current === pageNum}
                        className={`h-8 min-w-[32px] cursor-pointer rounded-full px-2.5 text-xs ${
                          pagination.current === pageNum
                            ? "bg-red-100 text-red-700 font-semibold border border-red-200"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => onPageChange(Math.min(Math.max(1, Math.ceil(pagination.total / pagination.pageSize)), pagination.current + 1), pagination.pageSize)}
                      className={`h-8 px-2.5 text-xs cursor-pointer rounded-full ${
                        pagination.current >= Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
                          ? "pointer-events-none opacity-40"
                          : "hover:bg-slate-100"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

