import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Car, Hash, Building2, Wrench, Users, Calendar, Info, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModelById } from "@/api/modelsApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Ngưng hoạt động",
    PENDING: "Chờ duyệt",
  };
  return statusMap[status?.toUpperCase()] || status || "—";
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    INACTIVE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  };
  return classMap[status?.toUpperCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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

const translateColor = (color) => {
  if (!color) return "—";
  const colorMap = {
    red: "Đỏ",
    blue: "Xanh dương",
    green: "Xanh lá",
    yellow: "Vàng",
    orange: "Cam",
    purple: "Tím",
    pink: "Hồng",
    black: "Đen",
    white: "Trắng",
    gray: "Xám",
    grey: "Xám",
    brown: "Nâu",
    silver: "Bạc",
    gold: "Vàng",
  };
  return colorMap[color.toLowerCase()] || color;
};

// Hàm chuyển tên màu thành mã hex để hiển thị màu thực tế
const getColorHex = (color) => {
  if (!color) return "#999999"; // Màu xám mặc định
  const colorUpper = String(color).trim().toUpperCase();
  const colorHexMap = {
    BLUE: "#1890ff",
    RED: "#ff4d4f",
    GREEN: "#52c41a",
    YELLOW: "#fadb14",
    BLACK: "#000000",
    WHITE: "#ffffff",
    GRAY: "#8c8c8c",
    GREY: "#8c8c8c",
    SILVER: "#c0c0c0",
    GOLD: "#ffd700",
    ORANGE: "#fa8c16",
    PURPLE: "#722ed1",
    PINK: "#eb2f96",
    BROWN: "#8b4513",
  };
  return colorHexMap[colorUpper] || color; // Nếu không tìm thấy, trả về giá trị gốc (có thể đã là hex)
};

export default function ModelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modelDetail, setModelDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModelDetail = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await getModelById(id);
          // Response structure: { statusCode, success, message, data }
          if (response?.data) {
            setModelDetail(response.data);
          } else if (response) {
            setModelDetail(response);
          }
        } catch (error) {
          console.error("Error fetching model detail:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchModelDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-sm">Đang tải chi tiết model...</p>
        </div>
      </div>
    );
  }

  if (!modelDetail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy model</h2>
          <p className="text-muted-foreground mb-4">Model với ID "{id}" không tồn tại</p>
          <Button variant="outline" onClick={() => navigate("/admin/models")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const totalVehicles = modelDetail.vehicles?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-[95%] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/models")}
            className="mb-3 gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Chi tiết model xe</h1>
              <p className="mt-1 text-sm text-slate-500">
                Thông tin chi tiết về model và các xe liên quan trong hệ thống
              </p>
              <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70" />
            </div>
            <Badge className={getStatusBadgeClass(modelDetail.status)}>
              {getStatusLabel(modelDetail.status)}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Thông tin model */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-red-50/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Thông tin model
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Mã model, tên và nhà sản xuất trong hệ thống
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    Mã model
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {modelDetail.code || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    Tên model
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {modelDetail.name || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    Nhà sản xuất
                  </label>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {modelDetail.manufacturer || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kế hoạch bảo dưỡng */}
          {modelDetail.maintenancePlan && (
            <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-3 bg-sky-50/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-500/10 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Kế hoạch bảo dưỡng
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Thông tin chi tiết về kế hoạch bảo dưỡng của model
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      Mã
                    </label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {modelDetail.maintenancePlan.code || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Tên
                    </label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {modelDetail.maintenancePlan.name || "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mô tả
                  </label>
                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                    {modelDetail.maintenancePlan.description || "Không có mô tả"}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" />
                      Số giai đoạn
                    </label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {modelDetail.maintenancePlan.totalStages || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Ngày hiệu lực
                    </label>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatDate(modelDetail.maintenancePlan.effectiveDate) || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Đơn vị
                    </label>
                    <div className="mt-1 flex gap-2 flex-wrap">
                      {modelDetail.maintenancePlan.unit?.map((unit, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {unit === "KILOMETER" ? "Km" : unit === "MONTH" ? "Tháng" : unit}
                        </Badge>
                      )) || "—"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danh sách xe */}
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Danh sách xe ({totalVehicles})
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Tất cả các xe thuộc model này trong hệ thống
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {modelDetail.vehicles && modelDetail.vehicles.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-16">STT</TableHead>
                        <TableHead>Màu sắc</TableHead>
                        <TableHead>Số khung</TableHead>
                        <TableHead>Số máy</TableHead>
                        <TableHead>Ngày sản xuất</TableHead>
                        <TableHead>Ngày mua</TableHead>
                        <TableHead>Hết bảo hành</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelDetail.vehicles.map((vehicle, idx) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-slate-300"
                                style={{ backgroundColor: getColorHex(vehicle.color) || "#ccc" }}
                              />
                              <span className="text-sm">{translateColor(vehicle.color)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {vehicle.chassisNumber || "—"}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {vehicle.engineNumber || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(vehicle.manufactureDate) || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(vehicle.purchaseDate) || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(vehicle.warrantyExpiry) || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getStatusBadgeClass(vehicle.status)}>
                              {getStatusLabel(vehicle.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Chưa có xe nào thuộc model này</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

