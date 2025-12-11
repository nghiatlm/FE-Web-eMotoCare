import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Wrench, Calendar, Info, FileText, Hash, Tag, Clock, Gauge, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMaintenancePlanById } from "@/api/maintenancePlansApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-toastify";

const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Ngưng hoạt động",
    SUSPENDED: "Tạm dừng",
  };
  return statusMap[status] || status || "—";
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
    INACTIVE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    SUSPENDED: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  };
  return classMap[status] || "bg-slate-100 text-slate-700 border-slate-200";
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateString;
  }
};

const formatMileage = (mileage) => {
  if (!mileage) return "—";
  const match = mileage.match(/KM(\d+)/);
  if (match) {
    const km = parseInt(match[1]);
    return `${km.toLocaleString("vi-VN")} km`;
  }
  return mileage;
};

const formatDurationMonth = (durationMonth) => {
  if (!durationMonth) return "—";
  const match = durationMonth.match(/MONTH_(\d+)/);
  if (match) {
    return `${match[1]} tháng`;
  }
  return durationMonth;
};

const getMileageValue = (mileage) => {
  if (!mileage) return 0;
  const match = mileage.match(/KM(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return 0;
};

export default function MaintenancePlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planDetail, setPlanDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanDetail = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await getMaintenancePlanById(id);
          if (response?.data) {
            setPlanDetail(response.data);
          } else if (response) {
            setPlanDetail(response);
          }
        } catch (error) {
          console.error("Error fetching maintenance plan detail:", error);
          toast.error("Lỗi: Không thể tải chi tiết lịch bảo dưỡng");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlanDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-sm">Đang tải chi tiết lịch bảo dưỡng...</p>
        </div>
      </div>
    );
  }

  if (!planDetail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-muted-foreground">Không tìm thấy lịch bảo dưỡng</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/admin/maintenance-plans")}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/admin/maintenance-plans")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Chi tiết lịch bảo dưỡng</h1>
              <p className="mt-2 text-sm text-slate-500">Thông tin chi tiết về lịch bảo dưỡng</p>
              <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-red-700 text-base sm:text-lg">
                <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="mb-6 pb-6 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      <Wrench className="h-3.5 w-3.5" />
                      Tên lịch bảo dưỡng
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                      {planDetail.name || "—"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 md:col-span-2">
                    <div className="flex-1 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        <Hash className="h-3.5 w-3.5" />
                        Mã lịch
                      </div>
                      <p className="text-lg font-bold text-slate-900 font-mono">{planDetail.code || "—"}</p>
                    </div>
                    <div className="flex-1 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        <Tag className="h-3.5 w-3.5" />
                        Trạng thái
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusBadgeClass(planDetail.status)}`}
                        >
                          {getStatusLabel(planDetail.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {planDetail.description && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      <FileText className="h-3.5 w-3.5" />
                      Mô tả
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {planDetail.description}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    Ngày hiệu lực
                  </div>
                  <p className="text-base sm:text-lg font-bold text-emerald-900">
                    {formatDate(planDetail.effectiveDate)}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-red-50 to-red-50/50 rounded-lg border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-700 mb-2">
                    <Wrench className="h-3.5 w-3.5 text-red-600" />
                    Số giai đoạn
                  </div>
                  <p className="text-base sm:text-lg font-bold text-red-900">
                    {planDetail.totalStages || 0} giai đoạn
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                    <Tag className="h-3.5 w-3.5 text-blue-600" />
                    Đơn vị
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planDetail.unit && planDetail.unit.length > 0 ? (
                      planDetail.unit.map((u, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-sm font-semibold bg-white border-blue-200 text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          {u === "KILOMETER" ? "KM" : u === "MONTH" ? "Tháng" : u}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {planDetail.maintenanceStages && planDetail.maintenanceStages.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-blue-50/80 to-blue-100/60 border-b border-blue-100 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-base sm:text-lg">
                  <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />
                  Các giai đoạn bảo dưỡng ({planDetail.maintenanceStages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-4 sm:space-y-6">
                  {[...planDetail.maintenanceStages]
                    .sort((a, b) => getMileageValue(a.mileage) - getMileageValue(b.mileage))
                    .map((stage, index) => (
                    <div
                      key={stage.id || index}
                      className="relative border border-slate-200 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all"
                    >
                      <div className="absolute -left-2 sm:-left-3 -top-2 sm:-top-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md z-10">
                        {index + 1}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2 pl-2 sm:pl-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                                {stage.name || "—"}
                              </h3>
                              {stage.description && (
                                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap">
                                  {stage.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusBadgeClass(stage.status)}`}
                            >
                              {getStatusLabel(stage.status)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {stage.mileage && (
                            <div className="flex items-center gap-2 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                                  Số km
                                </div>
                                <div className="text-sm sm:text-base font-semibold text-blue-900 truncate">
                                  {formatMileage(stage.mileage)}
                                </div>
                              </div>
                            </div>
                          )}

                          {stage.durationMonth && (
                            <div className="flex items-center gap-2 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
                              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                                  Thời hạn
                                </div>
                                <div className="text-sm sm:text-base font-semibold text-purple-900 truncate">
                                  {formatDurationMonth(stage.durationMonth)}
                                </div>
                              </div>
                            </div>
                          )}

                          {stage.estimatedTime && (
                            <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100 sm:col-span-2 lg:col-span-1">
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-green-700 uppercase tracking-wide">
                                  Thời gian ước tính
                                </div>
                                <div className="text-sm sm:text-base font-semibold text-green-900 truncate">
                                  {stage.estimatedTime} phút
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {stage.maintenanceStageDetails && stage.maintenanceStageDetails.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Chi tiết giai đoạn ({stage.maintenanceStageDetails.length})
                            </div>
                            <div className="space-y-2">
                              {stage.maintenanceStageDetails.map((detail, detailIndex) => (
                                <div
                                  key={detail.id || detailIndex}
                                  className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-2 sm:p-3 rounded border border-slate-100"
                                >
                                  {detail.name || `Chi tiết ${detailIndex + 1}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

