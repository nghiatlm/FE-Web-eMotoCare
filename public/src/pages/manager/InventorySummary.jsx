import { Fragment, useMemo, useState, useEffect } from "react";
import { Search, Calendar, ChevronRight, ChevronDown, MapPin, User2, Phone, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getServiceCenterInventories } from "@/api/serviceCenterInventoriesApi";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";

export default function InventorySummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [serviceCenterId, setServiceCenterId] = useState(null);

  // Get serviceCenterId from staff info
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (staffData?.serviceCenterId) {
          setServiceCenterId(staffData.serviceCenterId);
        }
      } catch (error) {
        console.error("Error fetching staff info:", error);
      }
    };

    if (user) {
      fetchStaffInfo();
    }
  }, [user]);

  // Fetch data from API
  useEffect(() => {
    if (!serviceCenterId) return; // Wait for serviceCenterId

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getServiceCenterInventories({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: search || undefined,
          status: status !== "all" ? status.toUpperCase() : undefined,
          serviceCenterId: serviceCenterId,
        });

        const data = response?.data || response;
        setInventories(data?.rowDatas || []);
        setPagination((prev) => ({
          ...prev,
          total: data?.total || 0,
          pageCurrent: data?.pageCurrent || 1,
        }));
      } catch (error) {
        console.error("Error fetching inventories:", error);
        setInventories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.pageSize, search, status, serviceCenterId]);

  // Transform API data to UI format
  const rows = useMemo(() => {
    const transformedRows = [];

    inventories.forEach((inventory) => {
      const serviceCenter = inventory.serviceCenter || {};
      
      // Get store keeper info
      const storeKeeper = serviceCenter.staffs?.find(s => s.position === "STORE_KEEPER");
      const warehouseInfo = `${serviceCenter.name || serviceCenter.code || ""}\nQL kho: ${storeKeeper ? `${storeKeeper.firstName || ""} ${storeKeeper.lastName || ""}`.trim() : ""}\n${serviceCenter.phone || ""}`;

      // Group partItems by part type (e.g., "EVO200-ODPT-001" -> "EVO200-ODPT")
      // This groups items with the same part type together
      const partItemsMap = new Map();

      (inventory.partItems || []).forEach((item) => {
        if (!item.serialNumber) return;

        // Extract part type from serialNumber (remove the last number segment)
        // "EVO200-ODPT-001" -> "EVO200-ODPT"
        // "KLARAS-PT-001" -> "KLARAS-PT"
        const parts = item.serialNumber.split("-");
        const partType = parts.slice(0, -1).join("-"); // Remove last segment (the number)
        const key = partType || item.serialNumber;

        if (!partItemsMap.has(key)) {
          partItemsMap.set(key, {
            partCode: key,
            partName: key, // Use the part type as name
            items: [],
            totalQty: 0,
          });
        }

        const part = partItemsMap.get(key);
        part.items.push(item);
        part.totalQty += item.quantity || 1;
      });

      // Convert map to array
      partItemsMap.forEach((partData, key) => {
        transformedRows.push({
          id: `${inventory.id}-${key}`,
          partCode: partData.partCode,
          partName: partData.partName,
          totalQty: partData.totalQty,
          warehouse: warehouseInfo,
          description: serviceCenter.description || inventory.serviceCenterInventoryName || "",
          status: inventory.status?.toLowerCase() || "active",
          serials: partData.items.map((item) => ({
            id: item.serialNumber,
            partCode: partData.partCode,
            partName: partData.partName,
            qty: item.quantity || 1,
            warehouse: warehouseInfo,
          })),
        });
      });
    });

    // Apply filters
    return transformedRows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.partCode.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [inventories, search, status]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Boxes className="h-7 w-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Kho tổng</h1>
          </div>
          <p className="text-muted-foreground">Tổng quan tồn kho phụ tùng</p>
        </div>

        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-medium">Tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <Label className="mb-2 block">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nhập từ mã/tên phụ tùng..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <Label className="mb-2 block">Trạng thái</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Còn hàng</SelectItem>
                    <SelectItem value="out">Hết hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2">
                <Label className="mb-2 block">Từ</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <Label className="mb-2 block">Đến</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button className="whitespace-nowrap">Tìm kiếm</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-sm overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
              <tr>
                <th className="px-5 py-3 w-12"></th>
                <th className="text-left px-5 py-3 w-16 font-semibold text-foreground">STT</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Mã phụ tùng</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Tên phụ tùng</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Số lượng tồn kho</th>
                <th className="text-left px-5 py-3 min-w-[260px] font-semibold text-foreground">Kho</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Mô tả</th>
                <th className="text-left px-5 py-3 w-32 font-semibold text-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={8}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                const [line1, line2, line3] = String(r.warehouse || "").split("\n");
                const isExpanded = expandedId === r.id && r.serials?.length;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className={`bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200 ${
                        isExpanded ? "ring-1 ring-primary/20 shadow-md" : ""
                      }`}
                    >
                      <td className="px-5 py-4 align-top first:rounded-l-xl">
                        {r.serials?.length ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full border border-border/60 hover:border-primary"
                            onClick={() =>
                              setExpandedId((prev) => (prev === r.id ? null : r.id))
                            }
                            aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-medium text-muted-foreground first:rounded-l-xl">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="text-primary font-semibold tracking-wide">
                          {r.partCode}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{r.partName}</p>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                            Mã chuẩn: {r.partCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {r.totalQty} bộ
                        </Badge>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          {line1 && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{line1}</span>
                            </div>
                          )}
                          {line2 && (
                            <div className="flex items-center gap-2">
                              <User2 className="h-4 w-4" />
                              <span>{line2.replace("QL kho:", "QL kho:")}</span>
                            </div>
                          )}
                          {line3 && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{line3}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {r.description}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top last:rounded-r-xl">
                        <Button
                          size="sm"
                          className="gap-1 rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          onClick={() => navigate(`/manager/inventory/${encodeURIComponent(r.id)}`)}
                        >
                          Chi tiết
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={8} className="px-2">
                          <div className="mx-3 mb-2 rounded-2xl border border-border bg-gradient-to-br from-muted/40 to-background shadow-inner">
                            <div className="flex items-center justify-between px-6 py-3 border-b border-border/60">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Chi tiết serial
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {r.serials.length} số serial được quản lý cho phụ tùng này
                                </p>
                              </div>
                              <Badge variant="outline" className="px-3 py-1 text-xs">
                                Tổng {r.serials.reduce((sum, s) => sum + (s.qty || 0), 0)} bộ
                              </Badge>
                            </div>
                            <div className="overflow-x-auto pb-1">
                              <table className="w-full text-sm border-separate border-spacing-y-1">
                                <thead className="text-muted-foreground">
                                  <tr>
                                    <th className="text-left px-6 py-2 w-48 text-xs font-semibold uppercase tracking-wide">
                                      Mã phụ tùng
                                    </th>
                                    <th className="text-left px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Tên phụ tùng
                                    </th>
                                    <th className="text-left px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Số serial
                                    </th>
                                    <th className="text-left px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Số lượng tồn kho
                                    </th>
                                    <th className="text-left px-6 py-2 text-xs font-semibold uppercase tracking-wide min-w-[220px]">
                                      Kho
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.serials.map((serial) => {
                                    const [s1, s2, s3] = String(serial.warehouse || "").split("\n");
                                    return (
                                      <tr
                                        key={serial.id}
                                        className="bg-card/90 border border-border/40 shadow-sm"
                                      >
                                        <td className="px-6 py-3 text-primary font-semibold">
                                          {serial.partCode}
                                        </td>
                                        <td className="px-6 py-3">{serial.partName}</td>
                                        <td className="px-6 py-3 text-primary/90 font-medium">
                                          {serial.id}
                                        </td>
                                        <td className="px-6 py-3">
                                          <Badge variant="secondary" className="px-2">
                                            {serial.qty}
                                          </Badge>
                                        </td>
                                        <td className="px-6 py-3">
                                          <div className="space-y-1.5 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                              <MapPin className="h-4 w-4" />
                                              <span>{s1}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <User2 className="h-4 w-4" />
                                              <span>{s2}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Phone className="h-4 w-4" />
                                              <span>{s3}</span>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={8}>
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {pagination.total} mục
            {from && ` • từ ${format(new Date(from), "dd/MM/yyyy")}`}
            {to && ` • đến ${format(new Date(to), "dd/MM/yyyy")}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Trước
            </Button>
            <span className="text-muted-foreground px-2">
              Trang {pagination.pageCurrent || pagination.page} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


