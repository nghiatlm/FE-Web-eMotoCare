import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Megaphone, Calendar, Percent, Users, Filter, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaigns } from "@/api/campaignsApi";
import { useToast } from "@/hooks/use-toast";

// Data cứng về campaigns (fallback)
const mockCampaigns = [
  {
    id: "CAMP001",
    name: "Khuyến mãi dịch vụ bảo dưỡng mùa hè",
    description: "Giảm giá 20% cho tất cả dịch vụ bảo dưỡng định kỳ",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    discount: 20,
    status: "ACTIVE",
    totalQuantity: 500,
    usedQuantity: 234,
    createdAt: "2024-05-15",
  },
  {
    id: "CAMP002",
    name: "Thay lốp giảm 15%",
    description: "Ưu đãi đặc biệt cho dịch vụ thay lốp xe",
    startDate: "2024-07-01",
    endDate: "2024-07-31",
    discount: 15,
    status: "UPCOMING",
    totalQuantity: 300,
    usedQuantity: 0,
    createdAt: "2024-06-20",
  },
  {
    id: "CAMP003",
    name: "Combo bảo hành + sửa chữa",
    description: "Gói combo dịch vụ bảo hành kèm sửa chữa với mức giảm 25%",
    startDate: "2024-04-01",
    endDate: "2024-05-31",
    discount: 25,
    status: "ENDED",
    totalQuantity: 200,
    usedQuantity: 198,
    createdAt: "2024-03-20",
  },
  {
    id: "CAMP004",
    name: "Kiểm tra miễn phí",
    description: "Miễn phí kiểm tra tổng thể xe cho khách hàng mới",
    startDate: "2024-09-01",
    endDate: "2024-09-30",
    discount: 100,
    status: "UPCOMING",
    totalQuantity: 1000,
    usedQuantity: 0,
    createdAt: "2024-08-10",
  },
  {
    id: "CAMP005",
    name: "Giảm giá phụ tùng",
    description: "Giảm 10% cho tất cả phụ tùng chính hãng",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    discount: 10,
    status: "ENDED",
    totalQuantity: 1000,
    usedQuantity: 987,
    createdAt: "2023-12-15",
  },
  {
    id: "CAMP006",
    name: "Tặng voucher sửa chữa",
    description: "Tặng voucher 500.000đ cho khách hàng sửa chữa trên 5 triệu",
    startDate: "2024-08-01",
    endDate: "2024-08-15",
    discount: 0,
    status: "ACTIVE",
    totalQuantity: 500,
    usedQuantity: 156,
    createdAt: "2024-07-25",
  },
];

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
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Determine status based on dates
  const getCampaignStatus = (startDate, endDate, status) => {
    if (status?.toUpperCase() === "INACTIVE") return "ENDED";
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "UPCOMING";
    if (now >= start && now <= end) return "ACTIVE";
    return "ENDED";
  };

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter === "ENDED" ? "INACTIVE" : statusFilter }),
      };

      const response = await getCampaigns(params);
      console.log("📥 Campaigns API response:", response);
      
      // Axios interceptor đã trả về response.data, nên response đã là data rồi
      // Structure: { pageCurrent, pageSize, total, rowDatas: [...] }
      const rowDatas = response?.rowDatas || response?.data?.rowDatas || [];
      console.log("📋 Campaigns rowDatas:", rowDatas);
      
      // Map API data to UI format
      const mappedCampaigns = rowDatas.map((campaign) => {
        console.log("🔍 Mapping campaign:", campaign, "ID:", campaign.id);
        const campaignStatus = getCampaignStatus(campaign.startDate, campaign.endDate, campaign.status);
        return {
          id: campaign.id, // ✅ Dùng id từ API response
          name: campaign.title || campaign.name, // ✅ Ưu tiên title, fallback về name
          title: campaign.title, // ✅ Giữ nguyên title
          description: campaign.description || "",
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          discount: 0, // API không có discount, có thể lấy từ campaignDetails
          status: campaignStatus,
          totalQuantity: 0, // API không có, có thể tính từ campaignDetails
          usedQuantity: 0, // API không có
          createdAt: campaign.startDate,
          modelName: campaign.modelName,
          campaignDetails: campaign.campaignDetails || [],
          type: campaign.type, // Thêm type
          attachmentUrl: campaign.attachmentUrl, // Thêm attachmentUrl
        };
      });
      
      setCampaigns(mappedCampaigns);
      setTotal(response?.total || response?.data?.total || 0);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Không thể tải danh sách campaigns");
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Clear filters
  const handleClearFilter = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const filteredCampaigns = useMemo(() => {
    // If search is done on server, just return campaigns
    if (search) {
      return campaigns;
    }
    return campaigns.filter((campaign) => {
      if (statusFilter !== "all" && campaign.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [campaigns, search, statusFilter]);

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize);

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
              {(search || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleClearFilter}
                >
                  <Filter className="h-4 w-4" />
                  Xóa lọc
                </Button>
              )}
              <Button className="gap-2 ml-auto" size="sm" onClick={() => navigate("/admin/campaigns/new")}>
                <Plus className="h-4 w-4" />
                Tạo campaign mới
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-red-50 via-red-50/90 to-red-100/50 dark:from-red-950/20 dark:via-red-950/15 dark:to-red-900/10 border-b-2 border-red-200/60 dark:border-red-800/30">
                  {/* <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Mã campaign
                  </th> */}
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tên campaign
                  </th>
                 
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Thời gian
                  </th>
                 
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Đang tải...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Megaphone className="h-12 w-12 text-slate-300" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Không tìm thấy campaign phù hợp
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign, index) => (
                    <tr
                      key={campaign.id}
                      className={`transition-all duration-200 ease-in-out ${
                        index % 2 === 0 ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/30 hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-5 px-6 text-center">
                        <span className="font-bold text-primary text-sm">{campaign.title || campaign.name || campaign.id}</span>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="space-y-1 max-w-xs mx-auto">
                          <p className="font-semibold text-slate-900 text-sm leading-tight">{campaign.title || campaign.name || campaign.id}</p>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">{campaign.description}</p>
                        </div>
                      </td>
                      
                      <td className="py-5 px-6 text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1 text-xs text-slate-600">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(campaign.startDate)}</span>
                          </div>
                          <div className="text-xs text-slate-500">→ {formatDate(campaign.endDate)}</div>
                        </div>
                      </td>
                      
                      <td className="py-5 px-6 text-center">
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs border shadow-sm ${getStatusBadgeClass(
                              campaign.status
                            )}`}
                          >
                            {getStatusLabel(campaign.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Xem chi tiết"
                            onClick={() => {
                              console.log("🔍 Click view detail - campaign:", campaign);
                              console.log("🔍 Campaign ID:", campaign.id);
                              if (!campaign.id) {
                                console.error("❌ Campaign ID is undefined!", campaign);
                                toast({
                                  title: "Lỗi",
                                  description: "Không tìm thấy ID campaign",
                                  variant: "destructive"
                                });
                                return;
                              }
                              navigate(`/admin/campaigns/${campaign.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            title="Xóa"
                          >
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
          
          {/* Pagination */}
          {!loading && filteredCampaigns.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} trong tổng số {total} campaigns
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

