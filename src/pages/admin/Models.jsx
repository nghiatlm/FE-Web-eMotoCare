import { useState } from "react";
import { Search, Plus, Car, RefreshCw, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModelsTable from "@/components/ModelsTable";
import { syncModelData } from "@/api/modelsApi";
import { toast } from "react-toastify";

export default function Models() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | success | error
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("vi-VN", {
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

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus("syncing");
    try {
      const res = await syncModelData();
      const ok =
        res?.success === true ||
        res?.statusCode === 200 ||
        res?.data?.success === true ||
        res?.data?.statusCode === 200;
      if (ok) {
        setSyncStatus("success");
        setLastSync(new Date().toISOString());
        toast.success("Đồng bộ model xe thành công");
      } else {
        setSyncStatus("error");
        toast.error("Đồng bộ không thành công. Vui lòng thử lại.");
      }
    } catch (err) {
      setSyncStatus("error");
      toast.error("Đồng bộ thất bại. Vui lòng thử lại.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">Quản lý model xe</h1>
          </div>
          <p className="mt-2 text-sm sm:text-base md:text-lg font-medium text-slate-700">Theo dõi và quản lý các model xe trong hệ thống</p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]"/>
        </div>

        {/* Sync card */}
        <div className="mb-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Model xe</h3>
                  <p className="text-sm text-slate-600">Đồng bộ thông tin model xe từ hệ thống OEM</p>
                  <div className="mt-2 flex items-center gap-2">
                    {syncStatus === "success" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã đồng bộ
                      </span>
                    )}
                    {syncStatus === "error" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Lỗi đồng bộ
                      </span>
                    )}
                    {syncStatus === "syncing" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang đồng bộ
                      </span>
                    )}
                    {syncStatus === "idle" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                        <Clock className="h-3.5 w-3.5" />
                        Chưa đồng bộ
                      </span>
                    )}
                    <span className="text-xs text-slate-500">Lần gần nhất: {formatDateTime(lastSync)}</span>
                  </div>
                </div>
              </div>
              <div className="md:ml-auto flex-shrink-0 w-full md:w-auto">
                <Button
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 gap-2 px-6"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Đồng bộ
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="relative flex-1 w-full sm:min-w-[200px] sm:max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm model"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70 text-sm sm:text-base"
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="IN_ACTIVE">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            {(status || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("");
                  setSearch("");
                }}
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </div>

        <ModelsTable search={search} status={status} />
      </div>
    </div>
  );
}
