import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, User2, Phone, Loader2, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getPartItemsByServiceCenter } from "@/api/partitemsApi";

const buildBranchInfoFromStaff = (staff) => {
  if (!staff) return null;
  const serviceCenter = staff.serviceCenter || {};
  const managerName = serviceCenter.managerName || `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
  return {
    id: serviceCenter.id || staff.serviceCenterId || null,
    name: serviceCenter.name || serviceCenter.code || staff.serviceCenterName || "Chi nhánh của tôi",
    address: serviceCenter.address || "",
    manager: managerName,
    phone: serviceCenter.phone || "",
  };
};

const normalizePartCode = (item) => {
  const serialNumber = item.serialNumber || "";
  const serialParts = serialNumber.split("-");
  const serialPrefix = serialParts.length > 1 ? serialParts.slice(0, -1).join("-") : serialNumber;
  return (item.part?.code || serialPrefix || serialNumber || item.id || "").toLowerCase();
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
};

const getStatusLabel = (status) => {
  if (!status) return "Khả dụng";
  const statusUpper = status.toUpperCase();
  if (statusUpper === "ACTIVE") return "Khả dụng";
  if (statusUpper === "IN_ACTIVE" || statusUpper === "INACTIVE") return "Không khả dụng";
  return status;
};

export default function StorekeeperAccessoryDetail() {
  const { inventoryId, partCode } = useParams();
  const decodedPartCode = decodeURIComponent(partCode || "").toLowerCase();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [serviceCenterId, setServiceCenterId] = useState(searchParams.get("serviceCenterId") || null);
  const [branchInfo, setBranchInfo] = useState(location.state?.branchInfo || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partDetail, setPartDetail] = useState(null);

  const locationServiceCenterId = location.state?.serviceCenterId;

  useEffect(() => {
    if (locationServiceCenterId) {
      setServiceCenterId(locationServiceCenterId);
    }
  }, [locationServiceCenterId]);

  useEffect(() => {
    if (serviceCenterId && branchInfo) return;
    if (!user?.accountResponse?.id) return;
    const fetchStaff = async () => {
      try {
        const response = await getStaffByAccountId(user.accountResponse.id);
        const staff = response?.data?.rowDatas?.[0];
        if (staff?.serviceCenterId && !serviceCenterId) {
          setServiceCenterId(staff.serviceCenterId);
        }
        if (!branchInfo) {
          setBranchInfo(buildBranchInfoFromStaff(staff));
        }
        if (!staff?.serviceCenterId && !serviceCenterId) {
          setError("Không tìm thấy chi nhánh của bạn.");
        }
      } catch (err) {
        console.error("Error fetching staff info:", err);
        setError("Không thể tải thông tin chi nhánh.");
      }
    };
    fetchStaff();
  }, [serviceCenterId, branchInfo, user]);

  useEffect(() => {
    if (!serviceCenterId || !decodedPartCode) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getPartItemsByServiceCenter(serviceCenterId);
        // API trả về: { statusCode, success, message, data: [...] } - data là array trực tiếp
        let rows = [];
        if (Array.isArray(response?.data)) {
          // data là array trực tiếp
          rows = response.data;
        } else if (Array.isArray(response)) {
          // response là array trực tiếp
          rows = response;
        } else if (response?.data?.rowDatas) {
          // fallback: nếu có nested rowDatas
          rows = response.data.rowDatas;
        } else if (response?.rowDatas) {
          // fallback: nếu rowDatas ở root
          rows = response.rowDatas;
        }

        const matchingItems = (rows || []).filter(
          (item) => normalizePartCode(item) === decodedPartCode,
        );

        if (!matchingItems.length) {
          setError("Chưa có partItem nào cho phụ tùng này.");
          setPartDetail(null);
          return;
        }

        const detail = {
          partCode: matchingItems[0]?.part?.code || partCode,
          partName: matchingItems[0]?.part?.name || decodedPartCode.toUpperCase(),
          partImage: matchingItems[0]?.part?.image,
          partType: matchingItems[0]?.part?.partType?.name || "—",
          totalQty: matchingItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
          serials: matchingItems.map((item) => ({
            id: item.id,
            serialNumber: item.serialNumber || item.id,
            quantity: item.quantity || 1,
            status: item.status || "ACTIVE",
            price: item.price,
            warrantyPeriod: item.warrantyPeriod,
            warrantyStart: item.warantyStartDate,
            warrantyEnd: item.warantyEndDate,
          })),
        };
        setPartDetail(detail);
      } catch (err) {
        console.error("Error fetching part detail:", err);
        setError("Không thể tải dữ liệu phụ tùng. Vui lòng thử lại sau.");
        setPartDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [serviceCenterId, decodedPartCode, partCode]);

  const warehouseLines = useMemo(() => {
    if (!branchInfo) return ["", "", ""];
    return [
      branchInfo.address || branchInfo.name || "",
      branchInfo.manager ? `QL kho: ${branchInfo.manager}` : "",
      branchInfo.phone || "",
    ];
  }, [branchInfo]);

  const getAlertVariant = () => {
    if (!partDetail) return { text: "Đủ", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
    if (partDetail.totalQty === 0) return { text: "Hết", className: "bg-rose-100 text-rose-700 border border-rose-200" };
    if (partDetail.totalQty < 10) return { text: "Sắp thiếu", className: "bg-amber-100 text-amber-700 border border-amber-200" };
    return { text: "Đủ", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
              <div className="absolute inset-0 inline-block animate-spin rounded-full h-12 w-12 border-4 border-transparent border-r-primary/30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-base font-semibold text-slate-600 animate-pulse">Đang tải dữ liệu phụ tùng...</p>
          </div>
        </div>
      );
    }

    if (!partDetail) {
      return (
        <div className="py-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <Package className="h-16 w-16 text-slate-300" />
            <p className="text-base font-medium text-muted-foreground">
              {error || "Không tìm thấy dữ liệu phụ tùng."}
            </p>
          </div>
        </div>
      );
    }

    const badge = getAlertVariant();

    return (
      <div className="space-y-6">
        {/* Thông tin phụ tùng */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/80 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Thông tin phụ tùng</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Phần bên trái: Hình ảnh và thông tin cơ bản */}
              <div className="flex items-start gap-5">
                {partDetail.partImage ? (
                  <div className="relative h-28 w-28 rounded-xl overflow-hidden ring-4 ring-slate-100 shadow-lg flex-shrink-0">
                    <img
                      src={partDetail.partImage}
                      alt={partDetail.partName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-28 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-400 flex-shrink-0">
                    N/A
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{partDetail.partName}</h2>
                    <p className="text-sm text-slate-600 font-medium">Mã: <span className="font-semibold text-primary">{partDetail.partCode}</span></p>
                  </div>
                  <div>
                    <Badge className={`${badge.className} px-4 py-1.5 rounded-md font-semibold text-xs border shadow-sm`}>
                      {badge.text}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Phần bên phải: Loại và Tổng tồn kho */}
              <div className="flex items-center gap-6">
                <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2 tracking-wider">Loại</p>
                  <p className="text-base font-semibold text-slate-900">{partDetail.partType}</p>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold uppercase text-slate-600 mb-2 tracking-wider">Tổng tồn kho</p>
                  <p className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {partDetail.totalQty}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Danh sách partItem */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/80 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">
              Danh sách partItem ({partDetail.serials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-red-50 via-red-50/90 to-red-100/50 dark:from-red-950/20 dark:via-red-950/15 dark:to-red-900/10 border-b-2 border-red-200/60 dark:border-red-800/30">
                    <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mã serial
                    </th>
                    <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Bảo hành
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {partDetail.serials.map((serial, index) => (
                    <tr 
                      key={serial.id} 
                      className={`transition-all duration-200 ease-in-out group ${
                        index % 2 === 0 ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/30 hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-5 px-6 text-center">
                        <span className="font-semibold text-slate-900 text-sm">{serial.serialNumber}</span>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="flex items-center justify-center">
                          <Badge className="px-3 py-1.5 rounded-md font-semibold text-xs bg-primary/10 text-primary border border-primary/20">
                            {serial.quantity}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="flex items-center justify-center">
                          <Badge 
                            variant="outline" 
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs border shadow-sm ${
                              (serial.status || "ACTIVE").toUpperCase() === "ACTIVE" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {getStatusLabel(serial.status || "ACTIVE")}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-slate-900">
                            {serial.warrantyPeriod ? `${serial.warrantyPeriod} tháng` : "—"}
                          </span>
                          {serial.warrantyStart && serial.warrantyEnd && (
                            <p className="text-xs text-slate-500 font-medium">
                              {formatDate(serial.warrantyStart)} → {formatDate(serial.warrantyEnd)}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="gap-2 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <p className="text-sm font-medium text-slate-600">
            {branchInfo?.name || location.state?.serviceCenterInventoryName || ""}
          </p>
        </div>
        {error && !partDetail && !loading && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
}


