import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Megaphone, 
  Calendar, 
  Tag, 
  AlertTriangle, 
  Package, 
  Car, 
  Wrench, 
  Calendar as CalendarIcon,
  FileText,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgramDetails } from "../../../services/programService";
import { getPartById } from "../../../api/partsApi";
import { getModelById } from "../../../api/modelsApi";
import { useEffect, useState } from "react";


const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Đang diễn ra",
    UPCOMING: "Sắp diễn ra",
    ENDED: "Đã kết thúc",
    CANCELLED: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getProgramTypeLabel = (type) => {
  const typeMap = {
    RECALL: "Thu hồi",
    CAMPAIGN: "Chiến dịch",
  };
  return typeMap[type] || type;
};

const getSeverityLevelLabel = (level) => {
  const levelMap = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    CRITICAL: "Nghiêm trọng",
  };
  return levelMap[level] || level;
};

const getSeverityLevelColor = (level) => {
  const colorMap = {
    LOW: "bg-emerald-50 border-emerald-200 text-emerald-700",
    MEDIUM: "bg-amber-50 border-amber-200 text-amber-700",
    HIGH: "bg-orange-50 border-orange-200 text-orange-700",
    CRITICAL: "bg-rose-50 border-rose-200 text-rose-700",
  };
  return colorMap[level] || "bg-slate-50 border-slate-200 text-slate-700";
};

const getProgramTypeColor = (type) => {
  const colorMap = {
    RECALL: "bg-rose-50 border-rose-200 text-rose-700",
    CAMPAIGN: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return colorMap[type] || "bg-slate-50 border-slate-200 text-slate-700";
};

const getActionTypeColor = (action) => {
  const colorMap = {
    INSPECTION: "bg-blue-50 border-blue-200 text-blue-700",
    LUBRICATION: "bg-cyan-50 border-cyan-200 text-cyan-700",
    CHECK: "bg-indigo-50 border-indigo-200 text-indigo-700",
    REPAIR: "bg-amber-50 border-amber-200 text-amber-700",
    REPLACE: "bg-orange-50 border-orange-200 text-orange-700",
    NONE: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return colorMap[action] || "bg-slate-50 border-slate-200 text-slate-700";
};

const getActionTypeLabel = (action) => {
  const actionMap = {
    INSPECTION: "Kiểm tra",
    LUBRICATION: "Bôi trơn",
    NONE: "Không có",
    CHECK: "Kiểm tra",
    REPAIR: "Sửa chữa",
    REPLACE: "Thay thế",
  };
  return actionMap[action] || action;
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


export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [programDetailsData, setProgramDetailsData] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCampaign(id);
  }, [id])

  useEffect(() => {
    const programDetails = campaign?.programDetails || [];
    if (programDetails.length === 0) {
      setProgramDetailsData([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        const results = await Promise.all(
          programDetails.map(async (pd) => {
            let partData = null;
            let modelData = null;

            // Fetch part data
            if (pd.partId) {
              try {
                const partRes = await getPartById(pd.partId);
                partData = partRes?.data || partRes;
              } catch (error) {
                console.error("Error fetching part:", error);
              }
            }

            // Fetch model data
            if (pd.modelId) {
              try {
                const modelRes = await getModelById(pd.modelId);
                modelData = modelRes?.data || modelRes;
              } catch (error) {
                console.error("Error fetching model:", error);
              }
            }

            return {
              ...pd,
              partData,
              modelData,
            };
          })
        );
        setProgramDetailsData(results);
      } catch (error) {
        console.error("Error fetching program details:", error);
        setProgramDetailsData(programDetails.map((pd) => ({ ...pd, partData: null, modelData: null })));
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [campaign]);

  const fetchCampaign = async (id) => {
    try {
      setLoading(true);
      setError("");
      const res = await getProgramDetails(id);
      if (res) {
        setCampaign(res);
      } else {
        setError("Không tìm thấy chiến dịch");
      }
    } catch (err) {
      setError(err?.message || "Lỗi tải dữ liệu chiến dịch");
    } finally {
      setLoading(false);
    }
  }


  if (loading && !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Megaphone className="h-12 w-12 text-slate-300 mx-auto animate-pulse" />
          <h2 className="text-xl font-semibold text-slate-900">Đang tải chiến dịch...</h2>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Megaphone className="h-16 w-16 text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">{error || "Không tìm thấy campaign"}</h2>
          <p className="text-muted-foreground">Campaign với ID "{id}" không tồn tại</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => fetchCampaign(id)} disabled={loading}>
              {loading ? "Đang tải..." : "Thử lại"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/campaigns")}>Quay lại danh sách</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full p-4 sm:p-6 md:p-8 lg:p-10 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/admin/campaigns")} 
            className="gap-2 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>

        {/* Main Program Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-white p-6 md:p-8 border-b border-slate-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-rose-50">
                  <Megaphone className="h-8 w-8 text-rose-500" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900">
                      {campaign.name}
                    </h1>
                    {campaign.code && (
                      <Badge 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-800 font-mono text-xs px-3 py-1 border border-slate-200"
                      >
                        {campaign.code}
                      </Badge>
                    )}
                  </div>
                  {campaign.description && (
                    <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                      {campaign.description}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`px-5 py-2 rounded-lg font-semibold text-sm border-2 ${getStatusBadgeClass(campaign.status)}`}
              >
                {getStatusLabel(campaign.status)}
              </Badge>
            </div>
          </div>

          {/* Info Cards */}
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Start Date */}
              <div className="group relative p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Ngày bắt đầu</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{formatDate(campaign.startDate)}</p>
              </div>

              {/* End Date */}
              <div className="group relative p-5 rounded-xl border-2 border-sky-200 bg-sky-50 transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-sky-100">
                    <CalendarIcon className="h-5 w-5 text-sky-600" />
                  </div>
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Ngày kết thúc</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{formatDate(campaign.endDate)}</p>
              </div>

              {/* Program Type */}
              <div className={`group relative p-5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${getProgramTypeColor(campaign.programType)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-current/20">
                    <Tag className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Loại</p>
                </div>
                <p className="text-xl font-bold">{getProgramTypeLabel(campaign.programType)}</p>
              </div>

              {/* Severity Level */}
              <div className={`group relative p-5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${getSeverityLevelColor(campaign.severityLevel)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-current/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Mức độ</p>
                </div>
                <p className="text-xl font-bold">{getSeverityLevelLabel(campaign.severityLevel)}</p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Program Details Section */}
        <Card className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Chi tiết chương trình</CardTitle>
              {programDetailsData.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {programDetailsData.length} {programDetailsData.length === 1 ? 'chi tiết' : 'chi tiết'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingDetails && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-slate-600">Đang tải chi tiết...</p>
                </div>
              </div>
            )}
            {!loadingDetails && (programDetailsData?.length || 0) > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {programDetailsData.map((detail, idx) => {
                  const partData = detail.partData;
                  const modelData = detail.modelData;
                  const partName = partData?.name || partData?.partName || detail.partId || "—";
                  const partCode = partData?.code || partData?.partCode;
                  const partImg = partData?.image || partData?.imageUrl;
                  const modelName = modelData?.name || modelData?.modelName || detail.modelId || "—";
                  const modelCode = modelData?.code;

                  return (
                    <div
                      key={detail.id || idx}
                      className="group relative rounded-2xl border-2 border-slate-200 bg-white transition-all duration-300 overflow-hidden"
                    >
                      {/* Decorative bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-rose-400"></div>
                      
                      <div className="p-6 space-y-5">
                        {/* Part and Model Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Part Section */}
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                            <div className="relative h-16 w-16 rounded-xl border-2 border-blue-200 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                              {partImg ? (
                                <img src={partImg} alt={partName} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-8 w-8 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Package className="h-4 w-4 text-blue-600" />
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Phụ tùng</p>
                              </div>
                              <p className="text-base font-bold text-slate-900 truncate mb-1">{partName}</p>
                              {partCode && (
                                <Badge variant="outline" className="text-[10px] font-mono bg-white">
                                  {partCode}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Model Section */}
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <div className="relative h-16 w-16 rounded-xl border-2 border-emerald-200 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                              <Car className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Car className="h-4 w-4 text-emerald-600" />
                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Mẫu xe</p>
                              </div>
                              <p className="text-base font-bold text-slate-900 truncate mb-1">{modelName}</p>
                              {modelCode && (
                                <Badge variant="outline" className="text-[10px] font-mono bg-white">
                                  {modelCode}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action and Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Action Type */}
                          <div className={`p-4 rounded-xl border-2 ${getActionTypeColor(detail.actionType)}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="h-4 w-4" />
                              <p className="text-xs font-semibold uppercase tracking-wide">Hành động</p>
                            </div>
                            <p className="text-lg font-bold">
                              {getActionTypeLabel(detail.actionType) || "—"}
                            </p>
                          </div>

                          {/* Manufacture Year */}
                          {detail.manufactureYear && (
                            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Năm sản xuất</p>
                              </div>
                              <p className="text-lg font-bold text-slate-900">{detail.manufactureYear}</p>
                            </div>
                          )}

                          {/* Description */}
                          {detail.description && (
                            <div className={`p-4 rounded-xl border-2 border-slate-200 bg-slate-50 ${detail.manufactureYear ? '' : 'sm:col-span-2 lg:col-span-2'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-slate-600" />
                                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Mô tả</p>
                              </div>
                              <p className="text-sm text-slate-900 leading-relaxed">{detail.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!loadingDetails && (!programDetailsData || programDetailsData.length === 0) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Không có chi tiết chương trình</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

