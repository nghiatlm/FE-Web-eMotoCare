import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Calendar, Percent, Users, Clock, FileText, Edit, Trash2, Car, Package, DollarSign, Tag, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignById } from "@/api/campaignsApi";
import { getPartById } from "@/api/partsApi";
import { getModelById } from "@/api/modelsApi";
import { SERVICE_TYPE_MAP } from "@/utils/constants";
import { useToast } from "@/hooks/use-toast";

const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Đang diễn ra",
    INACTIVE: "Không hoạt động",
    ENDED: "Đã kết thúc",
    CANCELLED: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    INACTIVE: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    ENDED: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    CANCELLED: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return classMap[status] || "bg-muted text-muted-foreground border-border";
};

const getTypeLabel = (type) => {
  const typeMap = {
    RECALL: "Triệu hồi",
    CAMPAIGN: "Chiến dịch",
  };
  return typeMap[type] || type;
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

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [partNames, setPartNames] = useState({});
  const [modelNames, setModelNames] = useState({});

  useEffect(() => {
    const fetchCampaign = async () => {
      console.log("🔍 CampaignDetail - ID from params:", id);
      
      if (!id) {
        console.error("❌ CampaignDetail - ID is undefined!");
        toast({
          title: "Lỗi",
          description: "Không tìm thấy ID campaign",
          variant: "destructive"
        });
        navigate("/admin/campaigns");
        return;
      }

      try {
        setLoading(true);
        console.log("📤 Fetching campaign with ID:", id);
        const response = await getCampaignById(id);
        console.log("📥 CampaignDetail API response:", response);
        
        const campaignData = response?.data || response;
        console.log("📦 CampaignDetail data:", campaignData);
        
        if (!campaignData) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy campaign",
            variant: "destructive"
          });
          navigate("/admin/campaigns");
          return;
        }

        setCampaign(campaignData);

        // Fetch part names từ API dựa trên recallPartId
        const partIds =
          campaignData.programDetails?.map((detail) => detail.recallPartId).filter(Boolean) || [];
        const partNamesMap = {};

        await Promise.all(
          partIds.map(async (partId) => {
            try {
              const partResponse = await getPartById(partId);
              // Backend parts có thể trả về:
              // { statusCode, success, message, data: {...} } hoặc { data: {...} } hoặc {...}
              const partData =
                partResponse?.data?.data || partResponse?.data || partResponse;

              if (partData) {
                const partName = partData.name || "";
                const partCode = partData.code || "";
                partNamesMap[partId] =
                  partName && partCode
                    ? `${partName} (${partCode})`
                    : partName || partCode || partId;
              } else {
                partNamesMap[partId] = partId;
              }
            } catch (error) {
              console.error(`Error fetching part ${partId}:`, error);
              partNamesMap[partId] = partId;
            }
          })
        );

        setPartNames(partNamesMap);

        // Fetch model names
        const modelIds = campaignData.programModels?.map(model => model.vehicleModelId).filter(Boolean) || [];
        const modelNamesMap = {};
        await Promise.all(
          modelIds.map(async (modelId) => {
            try {
              const modelResponse = await getModelById(modelId);
              const modelData = modelResponse?.data || modelResponse;
              if (modelData) {
                modelNamesMap[modelId] = modelData.name || modelData.code || modelId;
              }
            } catch (error) {
              console.error(`Error fetching model ${modelId}:`, error);
              modelNamesMap[modelId] = modelId;
            }
          })
        );
        setModelNames(modelNamesMap);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể tải thông tin campaign",
          variant: "destructive"
        });
        navigate("/admin/campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Megaphone className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Không tìm thấy campaign</h2>
          <p className="text-muted-foreground">Campaign với ID "{id}" không tồn tại</p>
          <Button onClick={() => navigate("/admin/campaigns")}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  const programDetail = campaign.programDetails?.[0];
  const programModel = campaign.programModels?.[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/campaigns")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" />
              Xóa
            </Button>
          </div>
        </div>

        {/* Campaign Info */}
        <Card className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">{campaign.title}</CardTitle>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`px-3 py-1 rounded-md font-semibold text-xs border ${getStatusBadgeClass(campaign.status)}`}>
                  {getStatusLabel(campaign.status)}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 rounded-md font-semibold text-xs">
                  {getTypeLabel(campaign.type)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Mô tả
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description || "—"}</p>
                </div>

                {/* Image */}
                {campaign.attachmentUrl && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Hình ảnh đính kèm
                    </h3>
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={campaign.attachmentUrl}
                        alt="Campaign attachment"
                        className="w-full h-auto max-h-96 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Program Details */}
                {programDetail && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-5 w-5 text-primary" />
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Giảm giá</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">{programDetail.discountPercent || 0}%</p>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Số tiền thưởng</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(programDetail.bonusAmount || 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recall Action */}
                {programDetail?.recallAction && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Hành động recall</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{programDetail.recallAction}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4">
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground">Ngày bắt đầu</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatDate(campaign.startDate)}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground">Ngày kết thúc</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatDate(campaign.endDate)}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground">Loại dịch vụ</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {SERVICE_TYPE_MAP[programDetail?.serviceType] || programDetail?.serviceType || "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Models */}
                {campaign.programModels && campaign.programModels.length > 0 && (
                  <Card className="border border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Model xe áp dụng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {campaign.programModels.map((model, idx) => (
                        <Badge key={idx} variant="secondary" className="mr-1">
                          {modelNames[model.vehicleModelId] || model.vehicleModelId}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Parts */}
                {campaign.programDetails && campaign.programDetails.length > 0 && (
                  <Card className="border border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Phụ tùng
                      </CardTitle>
                    </CardHeader>
                    {/* <CardContent className="space-y-2">
                      {campaign.programDetails.map((detail, idx) => (
                        <Badge key={idx} variant="outline" className="mr-1">
                          {partNames[detail.recallPartId] || detail.recallPartId}
                        </Badge>
                      ))}
                    </CardContent> */}
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
