import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Calendar, Percent, Users, Clock, CheckCircle2, AlertCircle, TrendingUp, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgramDetails } from "../../../services/programService";
import { getPartById } from "../../../api/partsApi";
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

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partDetails, setPartDetails] = useState([]);
  const [loadingPart, setLoadingPart] = useState(false);

  useEffect(() => {
    fetchCampaign(id);
  }, [id])

  useEffect(() => {
    const recallPartIds = campaign?.programDetails?.map((pd) => pd?.recallPartId).filter(Boolean) || [];
    if (recallPartIds.length === 0) {
      setPartDetails([]);
      return;
    }

    const fetchParts = async () => {
      try {
        setLoadingPart(true);
        const results = await Promise.all(
          recallPartIds.map(async (pid) => {
            try {
              const res = await getPartById(pid);
              const data = res?.data || res;
              return { id: pid, data };
            } catch (error) {
              return { id: pid, data: null };
            }
          })
        );
        setPartDetails(results);
      } catch (error) {
        setPartDetails(recallPartIds.map((pid) => ({ id: pid, data: null })));
      } finally {
        setLoadingPart(false);
      }
    };

    fetchParts();
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
      <div className="w-full p-4 sm:p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/campaigns")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-200 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-rose-50">
                  <Megaphone className="h-6 w-6 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-slate-900">{campaign.title || campaign.name}</CardTitle>
                  {campaign.description && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {campaign.description}
                    </p>
                  )}
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
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/80 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Ngày bắt đầu</p>
                <p className="text-lg font-bold text-slate-900">{formatDate(campaign.startDate)}</p>
              </div>
              <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/80 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Ngày kết thúc</p>
                <p className="text-lg font-bold text-slate-900">{formatDate(campaign.endDate)}</p>
              </div>
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/80 shadow-sm space-y-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Loại</p>
                <p className="text-lg font-bold text-slate-900">{campaign.type === "RECALL" ? "Thu hồi" : campaign.type || "—"}</p>
              </div>
              {campaign.attachmentUrl && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1 sm:col-span-2 lg:col-span-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tài liệu đính kèm</p>
                  <a href={campaign.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                    Xem tài liệu
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {campaign.type !== "RECALL" && (
          <Card className="rounded-xl border border-rose-100 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-full">
                  Chi tiết chương trình
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.programDetails && campaign.programDetails.length > 0 ? (
                campaign.programDetails.map((pd) => (
                  <div key={pd.id} className="rounded-lg border border-rose-100 bg-rose-50/60 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {pd.serviceType && (
                      <div>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Loại dịch vụ</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {pd.serviceType === "CAMPAIGN_TYPE" ? "Chiến dịch" : pd.serviceType}
                        </p>
                      </div>
                    )}
                    {typeof pd.discountPercent !== "undefined" && (
                      <div>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Giảm giá</p>
                        <p className="text-sm font-semibold text-slate-900">{pd.discountPercent}%</p>
                      </div>
                    )}
                    {typeof pd.bonusAmount !== "undefined" && (
                      <div>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Thưởng</p>
                        <p className="text-sm font-semibold text-slate-900">{pd.bonusAmount}</p>
                      </div>
                    )}
                    {pd.recallAction && (
                      <div>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Hành động</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {pd.recallAction === "Triệu hồi" ? "Thu hồi" : pd.recallAction}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">Không có chi tiết chương trình.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border border-rose-100 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Phụ tùng liên quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingPart && <p className="text-sm text-slate-600">Đang tải phụ tùng...</p>}
            {!loadingPart && (partDetails?.length || 0) > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {partDetails.map((part) => {
                  const data = part.data;
                  const name = data?.name || data?.partName || part.id;
                  const code = data?.code || data?.partCode;
                  const img = data?.image || data?.imageUrl;
                  const detail = campaign.programDetails?.find((pd) => pd.recallPartId === part.id);
                  return (
                    <div
                      key={part.id}
                      className="rounded-2xl border border-rose-100 bg-white shadow-sm p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-xl border border-rose-100 overflow-hidden bg-rose-50 flex items-center justify-center text-xs font-semibold text-rose-500">
                          {img ? (
                            <img src={img} alt={name} className="h-full w-full object-cover" />
                          ) : (
                            "Không có ảnh"
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                            {code && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 rounded-full border border-slate-200">
                                {code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                          <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">Hành động</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {detail?.recallAction || (campaign.type === "RECALL" ? "Thu hồi" : "—")}
                          </p>
                        </div>
                        {campaign.type === "CAMPAIGN" && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                            <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">Giảm giá</p>
                            <p className="mt-1 font-semibold text-slate-900">{detail?.discountPercent ?? 0}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!loadingPart && (!partDetails || partDetails.length === 0) && (
              <p className="text-sm text-slate-600">Không có phụ tùng liên quan.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

