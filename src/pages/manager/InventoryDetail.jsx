import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Hash, Package, MapPin, User2, Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getServiceCenterInventories } from "@/api/serviceCenterInventoriesApi";

const buildWarehouseInfo = (serviceCenter) => {
  if (!serviceCenter) return "";
  const storeKeeper = serviceCenter.staffs?.find((s) => s.position === "STORE_KEEPER");
  const keeperName = storeKeeper ? `${storeKeeper.firstName || ""} ${storeKeeper.lastName || ""}`.trim() : "";
  return `${serviceCenter.name || serviceCenter.code || ""}\nQL kho: ${keeperName}\n${serviceCenter.phone || ""}`.trim();
};

const normalizePartCode = (item) => {
  const serialNumber = item.serialNumber || "";
  const serialParts = serialNumber.split("-");
  const prefix = serialParts.length > 1 ? serialParts.slice(0, -1).join("-") : serialNumber;
  return (item.part?.code || prefix || serialNumber || "").toLowerCase();
};

export default function InventoryDetail() {
  const { inventoryId, partCode } = useParams();
  const decodedPartCode = decodeURIComponent(partCode || "").toLowerCase();
  const [searchParams] = useSearchParams();
  const queryServiceCenterId = searchParams.get("serviceCenterId");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [serviceCenterId, setServiceCenterId] = useState(queryServiceCenterId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partDetail, setPartDetail] = useState(null);

  useEffect(() => {
    if (queryServiceCenterId) {
      setServiceCenterId(queryServiceCenterId);
      return;
    }

    if (!user?.accountResponse?.id) return;
    const fetchStaff = async () => {
      try {
        const staffResponse = await getStaffByAccountId(user.accountResponse.id);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        if (staffData?.serviceCenterId) {
          setServiceCenterId(staffData.serviceCenterId);
        } else {
          setError("Không tìm thấy thông tin kho của bạn.");
        }
      } catch (err) {
        console.error("Error fetching staff info:", err);
        setError("Không thể lấy thông tin kho, vui lòng thử lại sau.");
      }
    };

    fetchStaff();
  }, [user, queryServiceCenterId]);

  useEffect(() => {
    if (!serviceCenterId || !inventoryId || !decodedPartCode) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getServiceCenterInventories({
          serviceCenterId,
          page: 1,
          pageSize: 50,
        });
        const data = response?.data || response;
        const inventory = data?.rowDatas?.find((item) => item.id === inventoryId);

        if (!inventory) {
          setError("Không tìm thấy kho phù hợp.");
          setPartDetail(null);
          return;
        }

        const warehouseInfo = buildWarehouseInfo(inventory.serviceCenter);
        const matchingItems = (inventory.partItems || []).filter(
          (item) => normalizePartCode(item) === decodedPartCode,
        );

        const detail = {
          inventoryId: inventory.id,
          serviceCenterInventoryName: inventory.serviceCenterInventoryName,
          partCode: decodeURIComponent(partCode),
          partName: matchingItems[0]?.part?.name || decodeURIComponent(partCode),
          description: inventory.serviceCenter?.description || inventory.serviceCenterInventoryName || "",
          warehouse: warehouseInfo,
          totalQty: matchingItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
          serials: matchingItems.map((item) => ({
            id: item.id,
            serialNumber: item.serialNumber || item.id,
            quantity: item.quantity || 1,
            warehouse: warehouseInfo,
          })),
        };

        if (!matchingItems.length) {
          setError("Chưa có partItem nào cho phụ tùng này.");
        }

        setPartDetail(detail);
      } catch (err) {
        console.error("Error fetching inventory detail:", err);
        setError("Không thể tải dữ liệu phụ tùng, vui lòng thử lại sau.");
        setPartDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [serviceCenterId, inventoryId, decodedPartCode, partCode]);

  const [w1, w2, w3] = useMemo(() => {
    if (!partDetail?.warehouse) return ["", "", ""];
    return String(partDetail.warehouse).split("\n");
  }, [partDetail?.warehouse]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tải dữ liệu phụ tùng...</span>
          </div>
        </div>
      );
    }

    if (!partDetail) {
      return (
        <div className="py-16 text-center text-muted-foreground">
          {error || "Không tìm thấy dữ liệu phụ tùng."}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>Mã phụ tùng</span>
                  </div>
                  <p className="font-medium text-foreground">{partDetail.partCode}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Tên phụ tùng</span>
                  </div>
                  <p className="font-medium text-foreground">{partDetail.partName}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Mô tả</span>
                </div>
                <p className="text-sm bg-muted/50 p-3 rounded-md">
                  {partDetail.description || "Chưa có mô tả cho phụ tùng này."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tồn kho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Số lượng tồn kho</span>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-base px-2 py-1">{partDetail.totalQty}</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {w1 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{w1}</span>
                  </div>
                )}
                {w2 && (
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <span>{w2}</span>
                  </div>
                )}
                {w3 && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{w3}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Danh sách partItem ({partDetail.serials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-5 py-3 w-16">STT</th>
                    <th className="text-left px-5 py-3">Serial</th>
                    <th className="text-left px-5 py-3">Số lượng</th>
                    <th className="text-left px-5 py-3 min-w-[260px]">Kho</th>
                  </tr>
                </thead>
                <tbody>
                  {partDetail.serials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                        Không có partItem nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    partDetail.serials.map((serial, index) => {
                      const [l1, l2, l3] = String(serial.warehouse || "").split("\n");
                      return (
                        <tr key={serial.id} className="border-t border-border/60">
                          <td className="px-5 py-3">{index + 1}</td>
                          <td className="px-5 py-3 text-primary font-medium">
                            {serial.serialNumber}
                          </td>
                          <td className="px-5 py-3">{serial.quantity}</td>
                          <td className="px-5 py-3">
                            <div className="space-y-1.5 text-sm">
                              {l1 && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{l1}</span>
                                </div>
                              )}
                              {l2 && (
                                <div className="flex items-center gap-2">
                                  <User2 className="h-4 w-4 text-muted-foreground" />
                                  <span>{l2}</span>
                                </div>
                              )}
                              {l3 && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{l3}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">Chi tiết phụ tùng</h1>
            <p className="text-sm text-muted-foreground">
              {partDetail?.serviceCenterInventoryName ||
                location.state?.serviceCenterInventoryName ||
                "Kho tổng"}
            </p>
          </div>
        </div>

        {error && !loading && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}

