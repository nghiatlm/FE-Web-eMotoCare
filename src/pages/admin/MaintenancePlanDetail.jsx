import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Wrench, Calendar, Info, FileText, Hash, Tag } from "lucide-react";
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
          // Response structure: { statusCode, success, message, data }
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
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/admin/maintenance-plans")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Chi tiết lịch bảo dưỡng</h1>
              <p className="mt-2 text-sm text-slate-500">Thông tin chi tiết về lịch bảo dưỡng</p>
              <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70"/>
            </div>
            <Button
              onClick={() => navigate(`/admin/maintenance-plans/${id}/edit`)}
              className="bg-red-600 hover:bg-red-700"
            >
              Chỉnh sửa
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6">
          {/* Thông tin cơ bản */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Info className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Hash className="h-4 w-4" />
                    Mã lịch
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{planDetail.code || "—"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Tag className="h-4 w-4" />
                    Trạng thái
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(planDetail.status)}`}
                    >
                      {getStatusLabel(planDetail.status)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Wrench className="h-4 w-4" />
                    Tên lịch bảo dưỡng
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{planDetail.name || "—"}</p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <FileText className="h-4 w-4" />
                    Mô tả
                  </div>
                  <p className="text-base text-slate-700 whitespace-pre-wrap">
                    {planDetail.description || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Calendar className="h-4 w-4" />
                    Ngày hiệu lực
                  </div>
                  <p className="text-base font-medium text-slate-900">
                    {formatDate(planDetail.effectiveDate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Wrench className="h-4 w-4" />
                    Số giai đoạn
                  </div>
                  <p className="text-base font-medium text-slate-900">
                    {planDetail.totalStages || 0}
                  </p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Tag className="h-4 w-4" />
                    Đơn vị
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planDetail.unit && planDetail.unit.length > 0 ? (
                      planDetail.unit.map((u, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
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
        </div>
      </div>
    </div>
  );
}

