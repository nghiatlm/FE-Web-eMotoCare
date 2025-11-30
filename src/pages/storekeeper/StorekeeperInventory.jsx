import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, PackagePlus, MapPin, Building2, Eye, AlertTriangle, User2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getPartItemsByServiceCenter } from "@/api/partitemsApi";
import { getServiceCenterById } from "@/api/serviceCentersApi";

const STOCK_THRESHOLD = 10;

const normalizePartCode = (item) => {
  const serialNumber = item.serialNumber || "";
  const serialParts = serialNumber.split("-");
  const serialPrefix = serialParts.length > 1 ? serialParts.slice(0, -1).join("-") : serialNumber;
  return (item.part?.code || serialPrefix || serialNumber || item.id || "").toUpperCase();
};

const aggregatePartItems = (partItems, branchInfo) => {
  const map = new Map();
  (partItems || []).forEach((item) => {
    if (!item) return;
    const part = item.part || {};
    const partCode = normalizePartCode(item);
    if (!map.has(partCode)) {
      map.set(partCode, {
        id: part.id || partCode,
        partId: part.id,
        serviceCenterId: branchInfo?.id || null,
        partCode,
        partName: part.name || "Phụ tùng",
        partType: part.partType?.name || "—",
        partImage: part.image,
        unit: part.unit || part.partType?.unit || "Bộ",
        statusBackend: (part.status || item.status || "ACTIVE").toUpperCase(),
        totalQty: 0,
        minStock: STOCK_THRESHOLD,
      });
    }
    const entry = map.get(partCode);
    // QUAN TRỌNG: Lấy quantity từ item (partItem) ở ngoài, KHÔNG phải từ part.quantity ở trong
    // item.quantity là số lượng thực tế của partItem trong kho
    // part.quantity là số lượng tổng của part (không dùng ở đây)
    entry.totalQty += item.quantity || 0;
    if (!entry.partImage && part.image) {
      entry.partImage = part.image;
    }
  });

  return Array.from(map.values()).map((entry) => {
    const alert = entry.totalQty === 0 ? "out" : entry.totalQty < entry.minStock ? "low" : "sufficient";
    return { ...entry, alert };
  });
};

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

const getAlertBadge = (alert) => {
  switch (alert) {
    case "out":
      return { label: "Hết", className: "bg-rose-100 text-rose-700 border border-rose-200" };
    case "low":
      return { label: "Sắp thiếu", className: "bg-amber-100 text-amber-700 border border-amber-200" };
    default:
      return { label: "Đủ", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  }
};

const getRowBackground = (alert) => {
  switch (alert) {
    case "out":
      return "bg-rose-50/50 hover:bg-rose-50";
    case "low":
      return "bg-amber-50/50 hover:bg-amber-50";
    default:
      return "bg-white hover:bg-slate-50/50";
  }
};

const getQuantityColor = (alert) => {
  switch (alert) {
    case "out":
      return "text-rose-600";
    case "low":
      return "text-amber-600";
    default:
      return "text-emerald-600";
  }
};

const StockBar = ({ current, min }) => {
  const ratio = min > 0 ? current / min : 1;
  const percent = Math.max(4, Math.min(ratio, 1.5) * 100);
  const barColor =
    current === 0 ? "bg-rose-500" : current < min ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-2 min-w-[180px]">
      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
        <div 
          className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full shadow-sm`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-600 font-medium">Min: {min}</span>
        {current < min ? (
          <span className="text-amber-600 font-semibold">Thiếu: {min - current}</span>
        ) : current > min ? (
          <span className="text-emerald-600 font-semibold">Dư: {current - min}</span>
        ) : (
          <span className="text-emerald-600 font-semibold">Đủ mức</span>
        )}
      </div>
    </div>
  );
};

export default function StorekeeperInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceCenterId, setServiceCenterId] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const [parts, setParts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let isMounted = true;
    const fetchStaffInfo = async () => {
      if (!user?.accountResponse?.id) return;
      try {
        const response = await getStaffByAccountId(user.accountResponse.id, { pageSize: 1 });
        const payload =
          response?.data?.rowDatas ||
          response?.data?.data ||
          response?.data ||
          response?.rowDatas ||
          response;
        const staff = Array.isArray(payload) ? payload[0] : payload;

        if (!staff) {
          if (isMounted) {
            setError("Không tìm thấy thông tin chi nhánh của thủ kho.");
          }
          return;
        }

        const resolvedServiceCenterId = staff.serviceCenterId || staff.serviceCenter?.id || null;
        if (resolvedServiceCenterId && isMounted) {
          setServiceCenterId(resolvedServiceCenterId);
        }

        let serviceCenter = staff.serviceCenter || null;
        if (!serviceCenter && resolvedServiceCenterId) {
          try {
            const centerRes = await getServiceCenterById(resolvedServiceCenterId);
            serviceCenter = centerRes?.data || centerRes;
          } catch (centerErr) {
            console.error("Error fetching service center:", centerErr);
          }
        }

        if (isMounted) {
          const managerName =
            serviceCenter?.managerName ||
            [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim() ||
            staff.managerName ||
            staff.fullName ||
            "—";

          setBranchInfo({
            id: serviceCenter?.id || resolvedServiceCenterId,
            name: serviceCenter?.name || serviceCenter?.code || staff.serviceCenterName || "Chi nhánh của tôi",
            address: serviceCenter?.address || staff.serviceCenterAddress || "",
            manager: managerName,
            phone: serviceCenter?.phone || serviceCenter?.contactNumber || staff.serviceCenterPhone || "",
          });
        }
      } catch (err) {
        console.error("Error fetching staff info:", err);
        if (isMounted) {
          setError("Không thể tải thông tin thủ kho.");
        }
      }
    };
    fetchStaffInfo();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const fetchPartItemsData = async () => {
      if (!serviceCenterId) return;
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
        setParts(aggregatePartItems(rows, branchInfo));
      } catch (err) {
        console.error("Error loading part items:", err);
        setError("Không thể tải tồn kho phụ tùng. Vui lòng thử lại sau.");
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartItemsData();
  }, [serviceCenterId, refreshKey, branchInfo]);

  useEffect(() => {
    setTablePage(1);
  }, [search, statusFilter]);

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      if (statusFilter !== "all" && part.alert !== statusFilter) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        part.partCode.toLowerCase().includes(q) ||
        part.partName.toLowerCase().includes(q) ||
        part.partType.toLowerCase().includes(q)
      );
    });
  }, [parts, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredParts.length / pageSize));
  const visibleParts = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredParts.slice(start, start + pageSize);
  }, [filteredParts, tablePage, pageSize]);

  const shortageCount = parts.filter((p) => p.alert !== "sufficient").length;

  const handleNavigateDetail = (part) => {
    navigate(
      `/storekeeper/accessories/${serviceCenterId || "current"}/${encodeURIComponent(part.partCode)}`,
      {
        state: {
          serviceCenterId: part.serviceCenterId || serviceCenterId,
          branchInfo,
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-semibold text-foreground">Tồn kho phụ tùng</h1>
          </div>
          <p className="text-muted-foreground">Danh sách phụ tùng tại chi nhánh của bạn</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-foreground">
                    {branchInfo?.name || "Chi nhánh của tôi"}
                  </span>
                  <Badge variant="secondary">Chi nhánh của tôi</Badge>
                </div>
                {branchInfo?.address && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{branchInfo.address}</span>
                  </div>
                )}
                {branchInfo?.manager && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Quản lý: <span className="font-medium text-foreground">{branchInfo.manager}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-700">Cần chú ý: {shortageCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên phụ tùng"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tình trạng tồn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="sufficient">Đủ</SelectItem>
              <SelectItem value="low">Sắp thiếu</SelectItem>
              <SelectItem value="out">Hết</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Xóa lọc
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <RotateCcw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-red-50 via-red-50/90 to-red-100/50 dark:from-red-950/20 dark:via-red-950/15 dark:to-red-900/10 border-b-2 border-red-200/60 dark:border-red-800/30">
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Mã phụ tùng
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tên phụ tùng
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    ĐVT
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tồn khả dụng
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider min-w-[200px]">
                    Mức cảnh báo
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Trạng thái tồn
                  </th>
                  <th className="text-center py-5 px-6 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-32">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
                          <div className="absolute inset-0 inline-block animate-spin rounded-full h-12 w-12 border-4 border-transparent border-r-primary/30" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        </div>
                        <p className="text-base font-semibold text-slate-600 animate-pulse">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : visibleParts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <PackagePlus className="h-12 w-12 text-slate-300" />
                        <p className="text-sm font-medium text-muted-foreground">Không có phụ tùng phù hợp</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleParts.map((part) => {
                    const badge = getAlertBadge(part.alert);
                    return (
                      <tr
                        key={part.id}
                        className={`${getRowBackground(part.alert)} transition-all duration-200 ease-in-out group`}
                      >
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center">
                            {part.partImage ? (
                              <div className="relative h-14 w-14 rounded-lg overflow-hidden ring-2 ring-slate-100 shadow-md group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                <img
                                  src={part.partImage}
                                  alt={part.partName}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-14 w-14 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-400">
                                N/A
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className="font-bold text-primary text-sm">{part.partCode}</span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900 text-sm leading-tight">{part.partName}</p>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-slate-700 bg-slate-100">
                            {part.unit}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="space-y-1">
                            <div className={`text-2xl font-bold ${getQuantityColor(part.alert)}`}>
                              {part.totalQty}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Min: {part.minStock}</p>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center">
                            <StockBar current={part.totalQty} min={part.minStock} />
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center">
                            <Badge className={`${badge.className} px-3 py-1.5 rounded-md font-semibold text-xs shadow-sm`}>
                              {badge.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-primary hover:text-primary hover:bg-primary/10 font-medium transition-all"
                              onClick={() => handleNavigateDetail(part)}
                            >
                              <Eye className="h-4 w-4" />
                              Chi tiết
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Hiển thị {visibleParts.length === 0 ? 0 : (tablePage - 1) * pageSize + 1}-
            {Math.min(tablePage * pageSize, filteredParts.length)} trong tổng {filteredParts.length} phụ tùng
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={tablePage <= 1}
              onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
            >
              Trước
            </Button>
            <span className="px-3">{tablePage}/{totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={tablePage >= totalPages}
              onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
            >
              Sau
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setTablePage(1);
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}


