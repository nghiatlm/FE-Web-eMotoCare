import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Calendar, Percent, Users, Clock, CheckCircle2, AlertCircle, TrendingUp, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgramDetails } from "../../../services/programService";
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

const renderProgramDetail = (pd) => {
  if (!pd) return "";
  if (typeof pd === "string") return pd;
  if (pd.program && typeof pd.program === "object") {
    const p = pd.program;
    return p.title || p.name || p.programName || p.description || p.id || p.code || JSON.stringify(p);
  }
  return pd.title || pd.name || pd.programName || pd.description || pd.programId || JSON.stringify(pd);
};

const renderModel = (m) => {
  if (!m) return "";
  if (typeof m === "string") return m;
  if (m.vehicleModel && typeof m.vehicleModel === "object") {
    const vm = m.vehicleModel;
    return vm.name || vm.modelName || vm.code || vm.id || JSON.stringify(vm);
  }
  return m.name || m.modelName || m.model || m.modelName || m.modelId || JSON.stringify(m);
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // const campaign = mockCampaigns.find((c) => c.id === id);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    fetchCampaign(id);
  }, [id])

  const fetchCampaign = async (id) => {
    var res = await getProgramDetails(id);
    console.log("Campaign details:", res);
    if (res) {
      setCampaign(res);
    }
  }


  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Megaphone className="h-16 w-16 text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy campaign</h2>
          <p className="text-muted-foreground">Campaign với ID "{id}" không tồn tại</p>
          <Button onClick={() => navigate("/admin/campaigns")}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  const hasQuantity = typeof campaign.totalQuantity === "number" && typeof campaign.usedQuantity === "number";
  const usagePercentage = hasQuantity ? Math.min(100, (campaign.usedQuantity / campaign.totalQuantity) * 100) : 0;
  const remainingQuantity = hasQuantity ? campaign.totalQuantity - campaign.usedQuantity : 0;

  return (
    <div className="min-h-screen bg-slate-50">
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
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/80 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{campaign.title || campaign.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">Mã: <span className="font-semibold text-primary">{campaign.id}</span></p>
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`px-4 py-1.5 rounded-md font-semibold text-sm border shadow-sm ${getStatusBadgeClass(campaign.status)}`}
              >
                {getStatusLabel(campaign.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Mô tả
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{campaign.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {typeof campaign.discount !== 'undefined' && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-5 w-5 text-primary" />
                        <p className="text-xs font-semibold uppercase text-slate-600 tracking-wider">Mức giảm giá</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">{campaign.discount}%</p>
                    </div>
                  )}

                  {hasQuantity && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="text-xs font-semibold uppercase text-slate-600 tracking-wider">Số lượng</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{campaign.usedQuantity} / {campaign.totalQuantity}</p>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {hasQuantity && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Tiến độ sử dụng</span>
                      <span className="text-sm font-semibold text-slate-900">{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${usagePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>Còn lại: {remainingQuantity}</span>
                      <span>Đã dùng: {campaign.usedQuantity}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4">
                <Card className="border border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-600">Ngày bắt đầu</p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{formatDate(campaign.startDate)}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-600">Ngày kết thúc</p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{formatDate(campaign.endDate)}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-600">Ngày tạo</p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{formatDateTime(campaign.createdAt) || campaign.createdBy || "—"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Áp dụng cho</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Chương trình / Chi tiết</p>
                      <div className="space-y-1">
                        {(campaign.programDetails || campaign.programs || []).map((pd, idx) => (
                          <div key={idx} className="text-sm text-slate-700">
                            {renderProgramDetail(pd)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Áp dụng cho mẫu xe</p>
                      <div className="space-y-1">
                        {(campaign.programModels || campaign.models || []).map((m, idx) => (
                          <Badge key={idx} variant="outline" className="mr-1">
                            {renderModel(m)}
                          </Badge>
                        ))}
                      </div>
                      {campaign.attachmentUrl && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Tài liệu đính kèm</p>
                          <a href={campaign.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                            Xem tài liệu
                          </a>
                        </div>
                      )}
                      {campaign.type && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Loại</p>
                          <p className="text-sm text-slate-900">{campaign.type}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Tỷ lệ sử dụng</p>
                  <p className="text-xl font-bold text-slate-900">{usagePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Đã sử dụng</p>
                  <p className="text-xl font-bold text-slate-900">{campaign.usedQuantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Còn lại</p>
                  <p className="text-xl font-bold text-slate-900">{remainingQuantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

