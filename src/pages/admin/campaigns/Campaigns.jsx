import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Megaphone, Calendar, Percent, Users, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { Table, Pagination, Spin, Empty, DatePicker } from "antd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { get } from "lodash";
import { getPrograms } from "../../../services/programService";


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
  // const [campaigns] = useState(mockCampaigns);
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
    // attach filters if present
    if (search) params.query = search;
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    if (modelId) params.modelId = modelId;
    if (dateRange && dateRange[0] && dateRange[1]) {
      // format as YYYY-MM-DD
      params.startDate = dateRange[0].format ? dateRange[0].format("YYYY-MM-DD") : dateRange[0];
      params.endDate = dateRange[1].format ? dateRange[1].format("YYYY-MM-DD") : dateRange[1];
    }
    try {
      const res = await getPrograms(params);
      console.log("Fetched campaigns:", res);

      // Normalize different response shapes
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

      // Try to find a total count
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

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, record, idx) => (
        <span className="font-bold text-primary text-sm">{(pagination.current - 1) * pagination.pageSize + idx + 1}</span>
      ),
      width: 80,
    },
    {
      title: "Tên campaign",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div className="space-y-1 max-w-xs">
          <div className="font-semibold text-slate-900 text-sm leading-tight">{record.name || record.title}</div>
          <div className="text-xs text-slate-500 font-medium line-clamp-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      render: (_, record) => <div className="text-center text-sm">{formatDate(record.startDate)}</div>,
    },
    {
      title: "Thời gian kết thúc",
      dataIndex: "endDate",
      key: "endDate",
      render: (_, record) => <div className="text-center text-sm">{formatDate(record.endDate)}</div>,
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
    },
  ];

  const onPageChange = (page, pageSize) => {
    fetchCampaigns(page, pageSize);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-semibold text-foreground">Danh sách Campaign</h1>
          </div>
          <p className="text-muted-foreground">Quản lý các chiến dịch khuyến mãi và ưu đãi</p>
        </div>

        {/* Filters and Actions */}
        <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo mã, tên hoặc mô tả campaign"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
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
                className="gap-2"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateRange([null, null]);
                  setTypeFilter("");
                  setModelId("");
                  // reset pagination and refetch
                  fetchCampaigns(1, pagination.pageSize);
                }}
              >
                <Filter className="h-4 w-4" />
                Xóa lọc
              </Button>
              <div className="w-full md:w-auto flex items-center gap-2">
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(vals) => setDateRange(vals)}
                  className="!w-[320px]"
                  format="YYYY-MM-DD"
                />
                <Input
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  placeholder="Type"
                  className="w-40"
                />
                <Input
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="Model ID"
                  className="w-40"
                />
                <Button
                  className="gap-2"
                  size="sm"
                  onClick={() => fetchCampaigns(1, pagination.pageSize)}
                >
                  Áp dụng
                </Button>
              </div>
              <Button className="gap-2 ml-auto" size="sm">
                <Plus className="h-4 w-4" />
                Tạo campaign mới
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table (Ant Design) */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Spin />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="py-12">
                <Empty description={error ? `Lỗi: ${error}` : "Không tìm thấy campaign phù hợp"} />
              </div>
            ) : (
              <div>
                <Table
                  dataSource={filteredCampaigns}
                  columns={columns}
                  rowKey={(record) => record.id || record.code}
                  pagination={false}
                />
                <div className="p-4 flex justify-end">
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={onPageChange}
                    showSizeChanger
                    onShowSizeChange={onPageChange}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

