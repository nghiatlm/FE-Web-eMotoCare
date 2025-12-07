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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
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
    
    if (!dataType?.hasApi) {
      toast.info(`Chức năng đồng bộ ${dataType?.label} đang được phát triển. Vui lòng thử lại sau.`, {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

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

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      const isSuccess = 
        response?.success === true || 
        response?.statusCode === 200 || 
        (response?.success !== false && response !== null && response !== undefined);

      if (isSuccess) {
        setSyncStates((prev) => ({
          ...prev,
          [typeId]: {
            status: SYNC_STATUS.SUCCESS,
            progress: 100,
            lastSync: new Date().toISOString(),
            error: null,
          },
        }));

        toast.success(
          `Đã đồng bộ ${dataType?.label} thành công!`,
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
      } else {
        throw new Error(response?.message || "Đồng bộ thất bại");
      }
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

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

      toast.error(`Đồng bộ ${dataType?.label} thất bại: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleSyncAll = async () => {
    const typesWithApi = DATA_TYPES.filter((type) => type.hasApi);
    
    if (typesWithApi.length === 0) {
      toast.info("Hiện tại chưa có API đồng bộ nào khả dụng.", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    for (const type of typesWithApi) {
      if (syncStates[type.id].status !== SYNC_STATUS.SYNCING) {
        await handleSync(type.id);
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
        <div className="mb-6">
          <div className="flex items-center gap-3 p-5 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <Server className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Đồng bộ dữ liệu OEM
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

                  {state.lastSync && !isSyncing && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Lần đồng bộ cuối: {formatDateTime(state.lastSync)}</span>
                    </div>
                  )}

                  {isError && state.error && (
                    <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300">{state.error}</p>
                      </div>
                    </div>
                  )}

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

        <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Thông tin đồng bộ
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Tổng quan về trạng thái đồng bộ dữ liệu
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DATA_TYPES.map((type) => {
                const state = syncStates[type.id];
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={cn(
                      "relative p-5 rounded-xl border-2 transition-all duration-200",
                      "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900",
                      state.status === SYNC_STATUS.SUCCESS && "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-emerald-100 dark:shadow-emerald-900/20",
                      state.status === SYNC_STATUS.ERROR && "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 shadow-red-100 dark:shadow-red-900/20",
                      state.status === SYNC_STATUS.SYNCING && "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 shadow-blue-100 dark:shadow-blue-900/20",
                      state.status === SYNC_STATUS.IDLE && "border-slate-200 dark:border-slate-700 shadow-slate-100 dark:shadow-slate-900/20"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
                        state.status === SYNC_STATUS.SUCCESS && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                        state.status === SYNC_STATUS.ERROR && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                        state.status === SYNC_STATUS.SYNCING && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                        state.status === SYNC_STATUS.IDLE && "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1 line-clamp-1">
                        {type.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {state.status === SYNC_STATUS.SUCCESS && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                      {state.status === SYNC_STATUS.ERROR && (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      {state.status === SYNC_STATUS.SYNCING && (
                        <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                      )}
                      {state.status === SYNC_STATUS.IDLE && (
                        <Clock className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        state.status === SYNC_STATUS.SUCCESS && "text-emerald-700 dark:text-emerald-300",
                        state.status === SYNC_STATUS.ERROR && "text-red-700 dark:text-red-300",
                        state.status === SYNC_STATUS.SYNCING && "text-blue-700 dark:text-blue-300",
                        state.status === SYNC_STATUS.IDLE && "text-slate-600 dark:text-slate-400"
                      )}>
                        {state.status === SYNC_STATUS.SUCCESS
                          ? "Đã đồng bộ"
                          : state.status === SYNC_STATUS.ERROR
                          ? "Lỗi"
                          : state.status === SYNC_STATUS.SYNCING
                          ? "Đang xử lý"
                          : "Chưa đồng bộ"}
                      </span>
                    </div>
                    {state.lastSync && state.status !== SYNC_STATUS.SYNCING && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {formatDateTime(state.lastSync)}
                      </p>
                    )}
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
