import { useState } from "react";
import { RefreshCw, Database, CheckCircle2, AlertCircle, Clock, Download, Loader2, Settings, Sparkles, Server, Bike, User, Wrench, Shield, Hash, FileText, Calendar, MapPin, CreditCard, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DATA_TYPES = [
  { id: "vehicles", label: "Dữ liệu xe", description: "Đồng bộ thông tin xe, model, phiên bản", icon: Database },
  { id: "parts", label: "Phụ tùng", description: "Đồng bộ danh sách phụ tùng và linh kiện", icon: Database },
  { id: "models", label: "Model xe", description: "Đồng bộ các model xe từ OEM", icon: Database },
  { id: "warranty", label: "Bảo hành", description: "Đồng bộ thông tin bảo hành", icon: Database },
];

const SYNC_STATUS = {
  IDLE: "idle",
  SYNCING: "syncing",
  SUCCESS: "success",
  ERROR: "error",
};

const RECENT_SYNCS = [
  {
    id: 1,
    type: "vehicles",
    status: "success",
    timestamp: new Date(Date.now() - 3600000),
    itemsSynced: 1250,
    duration: "2m 15s",
  },
  {
    id: 2,
    type: "parts",
    status: "success",
    timestamp: new Date(Date.now() - 7200000),
    itemsSynced: 3420,
    duration: "3m 45s",
  },
  {
    id: 3,
    type: "models",
    status: "error",
    timestamp: new Date(Date.now() - 86400000),
    itemsSynced: 0,
    duration: "0s",
    error: "Kết nối OEM thất bại",
  },
];

export default function SyncOEMData() {
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [syncingType, setSyncingType] = useState(null);
  const [progress, setProgress] = useState(0);
  const [syncResult, setSyncResult] = useState(null);
  
  // Tra cứu xe theo số khung
  const [chassisNumber, setChassisNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);

  const handleSelectType = (typeId) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSync = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một loại dữ liệu để đồng bộ",
        variant: "destructive",
      });
      return;
    }

    setSyncStatus(SYNC_STATUS.SYNCING);
    setProgress(0);

    try {
      // Simulate sync process
      for (let i = 0; i < selectedTypes.length; i++) {
        const typeId = selectedTypes[i];
        setSyncingType(typeId);

        // Simulate progress
        for (let j = 0; j <= 100; j += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          setProgress(((i / selectedTypes.length) * 100) + (j / selectedTypes.length) * 0.1);
        }
      }

      setSyncStatus(SYNC_STATUS.SUCCESS);
      setSyncingType(null);
      setProgress(100);

      // Mock data cứng từ structure API
      const mockResult = {
        customer: {
          id: "dc0b8a2a-7674-44d2-86bb-61287d31ebed",
          accountId: "48607eb5-31de-437e-acc7-250bfed0044f",
          account: {
            id: "48607eb5-31de-437e-acc7-250bfed0044f",
            phone: "0387723560",
            email: null,
            status: "ACTIVE",
            roleName: "ROLE_CUSTOMER",
          },
          firstName: "Thinh",
          lastName: "Tran",
          customerCode: "CUS-002",
          address: "HCM",
          citizenId: "002388233241923",
          dateOfBirth: "2020-01-01T00:00:00",
          gender: "MALE",
          avatarUrl: "string",
          createdAt: "2025-10-30T14:57:18.773928",
          updatedAt: "2025-11-28T14:07:10.173394",
        },
        vehicle: {
          id: "e960222d-23fa-4f1c-b46c-e0a5cee85f4b",
          image: "string",
          color: "Blue",
          chassisNumber: "CHAS-3123",
          engineNumber: "ENG-3213",
          status: "ACTIVE",
          manufactureDate: "2021-01-01T00:00:00",
          purchaseDate: "2022-01-01T00:00:00",
          warrantyExpiry: "2023-01-01T00:00:00",
          modelId: "d987684e-f3a8-49dd-8f12-f30fafc0d5ee",
          modelName: "VinFast Evo200",
          customerId: "dc0b8a2a-7674-44d2-86bb-61287d31ebed",
          createdAt: "2024-01-01T00:00:00",
          updatedAt: "2025-11-28T14:07:10.173394",
        },
        vehicleStage: {
          id: "1bcea110-cba5-11f0-ba23-6e018fbd1948",
          maintenanceStageId: "af460001-2222-2222-2222-222222222222",
          maintenanceStage: null,
          actualMaintenanceMileage: 0,
          actualMaintenanceUnit: "KILOMETER",
          vehicleId: "e960222d-23fa-4f1c-b46c-e0a5cee85f4b",
          dateOfImplementation: "2025-11-30T00:00:00",
          status: "UPCOMING",
          createdAt: "0001-01-01T00:00:00",
          updatedAt: null,
        },
      };

      setSyncResult(mockResult);

      toast({
        title: "Thành công",
        description: "Đồng bộ thông tin Khách hàng / Xe / Mốc bảo dưỡng thành công",
      });
    } catch (error) {
      setSyncStatus(SYNC_STATUS.ERROR);
      setSyncingType(null);
      setSyncResult(null);
      toast({
        title: "Lỗi",
        description: "Đồng bộ thất bại. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
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

  const getGenderLabel = (gender) => {
    switch (gender) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      case "OTHER":
        return "Khác";
      default:
        return gender || "—";
    }
  };

  const getMaintenanceUnitLabel = (unit) => {
    switch (unit) {
      case "KILOMETER":
        return "Ki-lô-mét";
      case "MILE":
        return "Dặm";
      case "HOUR":
        return "Giờ";
      default:
        return unit || "—";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "INACTIVE":
        return "Không hoạt động";
      case "UPCOMING":
        return "Sắp tới";
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status || "—";
    }
  };

  const getColorLabel = (color) => {
    if (!color) return "—";
    const colorMap = {
      "Blue": "Xanh dương",
      "Red": "Đỏ",
      "Black": "Đen",
      "White": "Trắng",
      "Silver": "Bạc",
      "Gray": "Xám",
      "Green": "Xanh lá",
      "Yellow": "Vàng",
      "Orange": "Cam",
      "Brown": "Nâu",
    };
    return colorMap[color] || color;
  };

  const getStatusBadgeForData = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Hoạt động
          </Badge>
        );
      case "UPCOMING":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
            <Clock className="h-3 w-3 mr-1" />
            Sắp tới
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            {status || "—"}
          </Badge>
        );
    }
  };

  const handleLookup = async () => {
    if (!chassisNumber.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số khung xe",
        variant: "destructive",
      });
      return;
    }

    setLookupLoading(true);
    setLookupNotFound(false);
    setLookupResult(null);

    try {
      // TODO: Thay thế bằng API thực tế
      // const response = await searchVehicleByChassis(chassisNumber.trim());
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data cứng từ structure API
      const mockData = {
        customer: {
          id: "dc0b8a2a-7674-44d2-86bb-61287d31ebed",
          accountId: "48607eb5-31de-437e-acc7-250bfed0044f",
          account: {
            id: "48607eb5-31de-437e-acc7-250bfed0044f",
            phone: "0387723560",
            email: null,
            status: "ACTIVE",
            roleName: "ROLE_CUSTOMER",
          },
          firstName: "Thinh",
          lastName: "Tran",
          customerCode: "CUS-002",
          address: "HCM",
          citizenId: "002388233241923",
          dateOfBirth: "2020-01-01T00:00:00",
          gender: "MALE",
          avatarUrl: "string",
          createdAt: "2025-10-30T14:57:18.773928",
          updatedAt: "2025-11-28T14:07:10.173394",
        },
        vehicle: {
          id: "e960222d-23fa-4f1c-b46c-e0a5cee85f4b",
          image: "string",
          color: "Blue",
          chassisNumber: chassisNumber.trim() || "CHAS-3123",
          engineNumber: "ENG-3213",
          status: "ACTIVE",
          manufactureDate: "2021-01-01T00:00:00",
          purchaseDate: "2022-01-01T00:00:00",
          warrantyExpiry: "2023-01-01T00:00:00",
          modelId: "d987684e-f3a8-49dd-8f12-f30fafc0d5ee",
          modelName: "VinFast Evo200",
          customerId: "dc0b8a2a-7674-44d2-86bb-61287d31ebed",
          createdAt: "2024-01-01T00:00:00",
          updatedAt: "2025-11-28T14:07:10.173394",
        },
        vehicleStage: {
          id: "1bcea110-cba5-11f0-ba23-6e018fbd1948",
          maintenanceStageId: "af460001-2222-2222-2222-222222222222",
          maintenanceStage: null,
          actualMaintenanceMileage: 0,
          actualMaintenanceUnit: "KILOMETER",
          vehicleId: "e960222d-23fa-4f1c-b46c-e0a5cee85f4b",
          dateOfImplementation: "2025-11-30T00:00:00",
          status: "UPCOMING",
          createdAt: "0001-01-01T00:00:00",
          updatedAt: null,
        },
      };

      setLookupResult(mockData);
      setLookupNotFound(false);
    } catch (error) {
      console.error("Error looking up vehicle:", error);
      setLookupNotFound(true);
      setLookupResult(null);
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin xe với số khung này",
        variant: "destructive",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const DetailRow = ({ label, value, icon: Icon, className }) => {
    return (
      <div className={cn("flex items-start gap-2 text-sm", className)}>
        {Icon && <Icon className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-foreground break-words">{value || "—"}</p>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Thành công
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Lỗi
          </Badge>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/10 dark:from-slate-950 dark:via-red-950/10 dark:to-slate-950">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-primary/10 shadow-sm backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Tra cứu thông tin xe từ OEM
                <Sparkles className="h-4 w-4 text-primary/60" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Nhập số khung xe để tra cứu thông tin chi tiết khách hàng, xe và mốc bảo dưỡng
              </p>
            </div>
          </div>
        </div>

        {/* Tra cứu xe theo số khung */}
        <Card className="border border-slate-200/80 dark:border-slate-700/80 shadow-lg bg-white dark:bg-slate-900/90 backdrop-blur-sm mb-6">
          <CardHeader className="pb-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 dark:from-slate-800/30 to-transparent">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                <Search className="h-4 w-4 text-primary dark:text-primary/80" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Tra cứu xe theo số khung</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1.5 text-slate-600 dark:text-slate-400">
              Nhập số khung xe để tra cứu thông tin chi tiết khách hàng, xe và mốc bảo dưỡng
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="chassisNumber" className="sr-only">
                  Số khung xe
                </Label>
                <Input
                  id="chassisNumber"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !lookupLoading) {
                      handleLookup();
                    }
                  }}
                  placeholder="Nhập số khung xe..."
                  className="h-11 text-sm border border-slate-300/60 dark:border-slate-600/60 bg-white dark:bg-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all font-mono font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500"
                  disabled={lookupLoading}
                />
              </div>
              <Button
                onClick={handleLookup}
                disabled={lookupLoading || !chassisNumber.trim()}
                className="h-11 px-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lookupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Tra cứu
                  </>
                )}
              </Button>
              {lookupResult && (
              <Button
                onClick={() => {
                  setChassisNumber("");
                  setLookupResult(null);
                  setLookupNotFound(false);
                }}
                variant="outline"
                className="h-11 px-5 border border-slate-300/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
              >
                Nhập lại
              </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kết quả tra cứu - Hiển thị dạng bảng ngang */}
        {lookupResult && !lookupLoading && (
          <div className="space-y-6 mb-6">
            {/* Vehicle Info - Bảng ngang */}
            {lookupResult.vehicle && (
              <Card className="border border-red-200/80 dark:border-red-900/50 shadow-lg bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-red-200/60 dark:border-red-900/40 bg-gradient-to-r from-red-50/50 dark:from-red-950/30 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 dark:bg-red-500/20">
                        <Bike className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-red-900 dark:text-red-100">Thông tin xe</CardTitle>
                    </div>
                    {getStatusBadgeForData(lookupResult.vehicle?.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-50/80 dark:bg-red-950/40 border-b border-red-200/60 dark:border-red-900/40">
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Số khung</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Số máy</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Model xe</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Màu sắc</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Ngày sản xuất</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Ngày mua</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Hết hạn bảo hành</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap px-4 py-3">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-red-50/40 dark:hover:bg-red-950/30 transition-colors border-b border-red-100/40 dark:border-red-900/30">
                          <TableCell className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.vehicle?.chassisNumber || "—"}</TableCell>
                          <TableCell className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.vehicle?.engineNumber || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.vehicle?.modelName || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{getColorLabel(lookupResult.vehicle?.color)}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{formatDate(lookupResult.vehicle?.manufactureDate)}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{formatDate(lookupResult.vehicle?.purchaseDate)}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{formatDate(lookupResult.vehicle?.warrantyExpiry)}</TableCell>
                          <TableCell className="px-4 py-3">
                            {getStatusBadgeForData(lookupResult.vehicle?.status)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Info - Bảng ngang */}
            {lookupResult.customer && (
              <Card className="border border-red-200/80 dark:border-red-900/50 shadow-lg bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-red-200/60 dark:border-red-900/40 bg-gradient-to-r from-red-50/50 dark:from-red-950/30 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 dark:bg-red-500/20">
                        <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-red-900 dark:text-red-100">Thông tin khách hàng</CardTitle>
                    </div>
                    {getStatusBadgeForData(lookupResult.customer?.account?.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-50/80 dark:bg-red-950/40 border-b border-red-200/60 dark:border-red-900/40">
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Họ và tên</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Mã khách hàng</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Số điện thoại</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Email</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Địa chỉ</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">CMND/CCCD</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Giới tính</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap px-4 py-3">Ngày sinh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-red-50/40 dark:hover:bg-red-950/30 transition-colors border-b border-red-100/40 dark:border-red-900/30">
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{`${lookupResult.customer?.firstName || ""} ${lookupResult.customer?.lastName || ""}`.trim() || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.customer?.customerCode || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.customer?.account?.phone || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.customer?.account?.email || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.customer?.address || "—"}</TableCell>
                          <TableCell className="text-sm font-medium font-mono text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.customer?.citizenId || "—"}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{getGenderLabel(lookupResult.customer?.gender)}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 px-4 py-3">{formatDate(lookupResult.customer?.dateOfBirth)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Stage Info - Bảng ngang */}
            {lookupResult.vehicleStage && (
              <Card className="border border-red-200/80 dark:border-red-900/50 shadow-lg bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-red-200/60 dark:border-red-900/40 bg-gradient-to-r from-red-50/50 dark:from-red-950/30 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 dark:bg-red-500/20">
                        <Settings className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-red-900 dark:text-red-100">Mốc bảo dưỡng</CardTitle>
                    </div>
                    {getStatusBadgeForData(lookupResult.vehicleStage?.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-50/80 dark:bg-red-950/40 border-b border-red-200/60 dark:border-red-900/40">
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Ngày thực hiện</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Số km bảo dưỡng</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Đơn vị</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap border-r border-red-200/60 dark:border-red-900/40 px-4 py-3">Mã bảo dưỡng</TableHead>
                          <TableHead className="text-sm font-semibold text-red-900 dark:text-red-100 whitespace-nowrap px-4 py-3">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-red-50/40 dark:hover:bg-red-950/30 transition-colors border-b border-red-100/40 dark:border-red-900/30">
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{formatDate(lookupResult.vehicleStage?.dateOfImplementation)}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">
                            {lookupResult.vehicleStage?.actualMaintenanceMileage ? `${lookupResult.vehicleStage.actualMaintenanceMileage.toLocaleString("vi-VN")} km` : "—"}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{getMaintenanceUnitLabel(lookupResult.vehicleStage?.actualMaintenanceUnit)}</TableCell>
                          <TableCell className="text-sm font-medium font-mono text-slate-700 dark:text-slate-300 border-r border-red-100/40 dark:border-red-900/30 px-4 py-3">{lookupResult.vehicleStage?.maintenanceStageId || "—"}</TableCell>
                          <TableCell className="px-4 py-3">
                            {getStatusBadgeForData(lookupResult.vehicleStage?.status)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Not Found Lookup */}
        {lookupNotFound && !lookupLoading && (
          <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm mb-6">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Không tìm thấy thông tin xe
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Không tìm thấy xe với số khung: <span className="font-mono font-medium text-foreground">{chassisNumber}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

