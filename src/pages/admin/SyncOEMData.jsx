import { useState } from "react";
import {
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Server,
  Bike,
  Wrench,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { syncMaintenancePlansData } from "@/api/maintenancePlansApi";
import { syncCampaignsData } from "@/api/campaignsApi";
import { syncModelData } from "@/api/modelsApi";

const SYNC_STATUS = {
  IDLE: "idle",
  SYNCING: "syncing",
  SUCCESS: "success",
  ERROR: "error",
};

const DATA_TYPES = [
  {
    id: "models",
    label: "Model xe",
    description: "Đồng bộ thông tin model xe từ hệ thống OEM",
    icon: Bike,
    buttonBg: "bg-red-600 dark:bg-red-700",
    buttonHover: "hover:bg-red-700 dark:hover:bg-red-800",
    buttonText: "text-white",
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    progressColor: "bg-red-400",
    hasApi: true,
  },
  {
    id: "parts",
    label: "Phụ tùng",
    description: "Đồng bộ danh mục phụ tùng, linh kiện từ hệ thống OEM",
    icon: Wrench,
    buttonBg: "bg-red-600 dark:bg-red-700",
    buttonHover: "hover:bg-red-700 dark:hover:bg-red-800",
    buttonText: "text-white",
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    progressColor: "bg-red-400",
    hasApi: false, // Chưa có API
  },
  {
    id: "maintenance-plans",
    label: "Lịch và giai đoạn bảo dưỡng",
    description: "Đồng bộ dữ liệu lịch bảo dưỡng và các giai đoạn bảo dưỡng từ hệ thống OEM",
    icon: Server,
    buttonBg: "bg-red-600 dark:bg-red-700",
    buttonHover: "hover:bg-red-700 dark:hover:bg-red-800",
    buttonText: "text-white",
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    progressColor: "bg-red-400",
    hasApi: true,
  },
  {
    id: "campaigns",
    label: "Chiến dịch",
    description: "Đồng bộ dữ liệu chiến dịch và chương trình từ hệ thống OEM",
    icon: Sparkles,
    buttonBg: "bg-red-600 dark:bg-red-700",
    buttonHover: "hover:bg-red-700 dark:hover:bg-red-800",
    buttonText: "text-white",
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    progressColor: "bg-red-400",
    hasApi: true,
  },
];

export default function SyncOEMData() {
  const { toast } = useToast();
  const [syncStates, setSyncStates] = useState(() => {
    const initialState = {};
    DATA_TYPES.forEach((type) => {
      initialState[type.id] = {
        status: SYNC_STATUS.IDLE,
        progress: 0,
        lastSync: null,
        error: null,
      };
    });
    return initialState;
  });

  const formatDateTime = (date) => {
    if (!date) return "—";
    try {
      const d = new Date(date);
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case SYNC_STATUS.SUCCESS:
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Thành công
          </Badge>
        );
      case SYNC_STATUS.ERROR:
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Lỗi
          </Badge>
        );
      case SYNC_STATUS.SYNCING:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Đang đồng bộ
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-3 w-3 mr-1" />
            Chưa đồng bộ
          </Badge>
        );
    }
  };

  const handleSync = async (typeId) => {
    const dataType = DATA_TYPES.find((t) => t.id === typeId);
    
    // Kiểm tra xem có API cho loại này không
    if (!dataType?.hasApi) {
      toast({
        title: "Chưa có API",
        description: `Chức năng đồng bộ ${dataType?.label} đang được phát triển. Vui lòng thử lại sau.`,
        variant: "default",
      });
      return;
    }

    // Update state to syncing
    setSyncStates((prev) => ({
      ...prev,
      [typeId]: {
        status: SYNC_STATUS.SYNCING,
        progress: 0,
        lastSync: prev[typeId].lastSync,
        error: null,
      },
    }));

    let progressInterval = null;
    
    try {
      // Simulate progress update
      progressInterval = setInterval(() => {
        setSyncStates((prev) => {
          const currentProgress = prev[typeId].progress;
          if (currentProgress < 90) {
            return {
              ...prev,
              [typeId]: {
                ...prev[typeId],
                progress: Math.min(currentProgress + 15, 90),
              },
            };
          }
          return prev;
        });
      }, 300);

      // Call actual API - gọi API tương ứng với loại dữ liệu
      let response;
      switch (typeId) {
        case "models":
          response = await syncModelData();
          break;
        case "maintenance-plans":
          response = await syncMaintenancePlansData();
          break;
        case "campaigns":
          response = await syncCampaignsData();
          break;
        default:
          throw new Error(`API chưa được triển khai cho loại: ${typeId}`);
      }

      // Clear interval trước khi xử lý response
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      // Check response (response đã là data từ interceptor)
      // Kiểm tra nhiều trường hợp success
      const isSuccess = 
        response?.success === true || 
        response?.statusCode === 200 || 
        (response?.success !== false && response !== null && response !== undefined);

      if (isSuccess) {
        // Success
        setSyncStates((prev) => ({
          ...prev,
          [typeId]: {
            status: SYNC_STATUS.SUCCESS,
            progress: 100,
            lastSync: new Date().toISOString(),
            error: null,
          },
        }));

        toast({
          title: "Đồng bộ thành công",
          description: response?.data || response?.message || `Đã đồng bộ ${dataType?.label} thành công!`,
        });
      } else {
        throw new Error(response?.message || "Đồng bộ thất bại");
      }
    } catch (error) {
      // Đảm bảo clear interval trong trường hợp lỗi
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      // Xử lý lỗi - kiểm tra nhiều cách error có thể được trả về
      const errorMessage = 
        error?.response?.data?.message || 
        error?.data?.message || 
        error?.message || 
        (typeof error === 'string' ? error : "Vui lòng thử lại");

      setSyncStates((prev) => ({
        ...prev,
        [typeId]: {
          status: SYNC_STATUS.ERROR,
          progress: 0,
          lastSync: prev[typeId].lastSync,
          error: errorMessage,
        },
      }));

      toast({
        title: "Đồng bộ thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSyncAll = async () => {
    // Chỉ sync các loại có API
    const typesWithApi = DATA_TYPES.filter((type) => type.hasApi);
    
    if (typesWithApi.length === 0) {
      toast({
        title: "Thông báo",
        description: "Hiện tại chưa có API đồng bộ nào khả dụng.",
        variant: "default",
      });
      return;
    }

    // Sync all types with API sequentially
    for (const type of typesWithApi) {
      if (syncStates[type.id].status !== SYNC_STATUS.SYNCING) {
        await handleSync(type.id);
        // Wait a bit between each sync to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  };

  const isAnySyncing = Object.values(syncStates).some(
    (state) => state.status === SYNC_STATUS.SYNCING
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 p-5 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <Server className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Đồng bộ dữ liệu OEM
                <Sparkles className="h-5 w-5 text-red-500/60" />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Đồng bộ dữ liệu từ hệ thống OEM vào hệ thống quản lý
              </p>
            </div>
            <Button
              onClick={handleSyncAll}
              disabled={isAnySyncing}
              size="sm"
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white shadow-md"
            >
              {isAnySyncing ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Đồng bộ dữ liệu
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Danh sách các loại dữ liệu cần đồng bộ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {DATA_TYPES.map((type) => {
            const Icon = type.icon;
            const state = syncStates[type.id];
            const isSyncing = state.status === SYNC_STATUS.SYNCING;
            const isSuccess = state.status === SYNC_STATUS.SUCCESS;
            const isError = state.status === SYNC_STATUS.ERROR;

            return (
              <Card
                key={type.id}
                className={cn(
                  "border-2 transition-all duration-200 hover:shadow-lg flex flex-col h-full",
                  isSyncing && "border-blue-400 shadow-blue-200/50",
                  isSuccess && "border-emerald-400 shadow-emerald-200/50",
                  isError && "border-red-400 shadow-red-200/50",
                  !isSyncing && !isSuccess && !isError && "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                          "bg-red-100 dark:bg-red-900/20",
                          "text-red-600 dark:text-red-400"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                          {type.label}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(state.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4">
                  {/* Progress bar khi đang đồng bộ */}
                  {isSyncing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          Đang đồng bộ...
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {state.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300 ease-out rounded-full bg-red-400"
                          )}
                          style={{ width: `${state.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Thông tin lần đồng bộ cuối */}
                  {state.lastSync && !isSyncing && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Lần đồng bộ cuối: {formatDateTime(state.lastSync)}</span>
                    </div>
                  )}

                  {/* Error message */}
                  {isError && state.error && (
                    <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300">{state.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Nút đồng bộ */}
                  <div className="mt-auto pt-2">
                    <Button
                      onClick={() => handleSync(type.id)}
                      disabled={isSyncing || !type.hasApi}
                      size="sm"
                      className={cn(
                        "w-full h-10 font-medium shadow-md transition-all text-sm",
                        type.hasApi
                          ? cn(type.buttonBg, type.buttonHover, type.buttonText)
                          : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : isSuccess ? (
                      <>
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Đồng bộ lại
                      </>
                    ) : !type.hasApi ? (
                      <>
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        Sắp có
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Đồng bộ
                      </>
                    )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Thông tin tổng quan */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Thông tin đồng bộ
            </CardTitle>
            <CardDescription className="text-xs">
              Tổng quan về trạng thái đồng bộ dữ liệu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DATA_TYPES.map((type) => {
                const state = syncStates[type.id];
                return (
                  <div
                    key={type.id}
                    className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{type.label}</p>
                    <div className="flex items-center justify-center gap-1">
                      {state.status === SYNC_STATUS.SUCCESS && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      {state.status === SYNC_STATUS.ERROR && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      {state.status === SYNC_STATUS.SYNCING && (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                      {state.status === SYNC_STATUS.IDLE && (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {state.status === SYNC_STATUS.SUCCESS
                          ? "Đã đồng bộ"
                          : state.status === SYNC_STATUS.ERROR
                          ? "Lỗi"
                          : state.status === SYNC_STATUS.SYNCING
                          ? "Đang xử lý"
                          : "Chưa đồng bộ"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
