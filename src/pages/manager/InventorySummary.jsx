import { useMemo, useState, useEffect } from "react";
import { Search, Calendar, ChevronRight, MapPin, User2, Phone, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [serviceCenterId, setServiceCenterId] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

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
          pageCurrent: data?.pageCurrent || prev.page || 1,
          page: data?.pageCurrent || prev.page || 1,
          pageSize: data?.pageSize || prev.pageSize || 10,
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

      const storeKeeper = serviceCenter.staffs?.find((s) => s.position === "STORE_KEEPER");
      const warehouseInfo = `${serviceCenter.name || serviceCenter.code || ""}\nQL kho: ${storeKeeper ? `${storeKeeper.firstName || ""} ${storeKeeper.lastName || ""}`.trim() : ""}\n${serviceCenter.phone || ""}`.trim();

      const partItemsMap = new Map();

      (inventory.partItems || []).forEach((item) => {
        if (!item) return;

        const serialNumber = item.serialNumber || "";
        const serialParts = serialNumber.split("-");
        const serialPrefix = serialParts.length > 1 ? serialParts.slice(0, -1).join("-") : serialNumber;

        const partCode = item.part?.code || serialPrefix || serialNumber || item.id;
        const partName = item.part?.name || serialPrefix || serialNumber || "Phụ tùng";
        const partImage = item.part?.image || null;
        const partStatus = item.part?.status?.toLowerCase() || item.status?.toLowerCase() || inventory.status?.toLowerCase() || "active";

        if (!partItemsMap.has(partCode)) {
          partItemsMap.set(partCode, {
            partCode,
            partName,
            partImage,
            partStatus,
            items: [],
            totalQty: 0,
          });
        }

        const entry = partItemsMap.get(partCode);
        entry.items.push({
          id: serialNumber || item.id,
          serialNumber,
          quantity: item.quantity || 1,
          qty: item.quantity || 1,
          price: item.price,
          warrantyStart: item.warantyStartDate,
          warrantyEnd: item.warantyEndDate,
          status: item.status?.toLowerCase() || "active",
          partCode,
          partName,
          partImage,
          warehouse: warehouseInfo,
        });
        entry.totalQty += item.quantity || 1;
        if (!entry.partImage && partImage) entry.partImage = partImage;
        if (entry.partName === serialPrefix && partName !== serialPrefix) {
          entry.partName = partName;
        }
        if (entry.partStatus === "active" && partStatus !== "active") {
          entry.partStatus = partStatus;
        }
      });

      partItemsMap.forEach((partData) => {
        transformedRows.push({
          id: `${inventory.id}-${partData.partCode}`,
          inventoryId: inventory.id,
          serviceCenterInventoryName: inventory.serviceCenterInventoryName,
          serviceCenterId: serviceCenter.id,
          partCode: partData.partCode,
          partName: partData.partName,
          partImage: partData.partImage,
          totalQty: partData.totalQty,
          warehouse: warehouseInfo,
          description: serviceCenter.description || inventory.serviceCenterInventoryName || "",
          status: partData.partStatus || inventory.status?.toLowerCase() || "active",
          serials: partData.items,
        });
      });
    });

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

  useEffect(() => {
    setTablePage(1);
  }, [search, status, inventories.length]);

  const visibleRows = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return rows.slice(start, start + tablePageSize);
  }, [rows, tablePage, tablePageSize]);

  const renderStatusBadge = (value) => {
    switch ((value || "").toLowerCase()) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Đang hoạt động</Badge>;
      case "inactive":
      case "out":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Tạm ngưng</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-border">{value}</Badge>;
    }
  };

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / (pagination.pageSize || 10)));
  const currentPage = pagination.pageCurrent || pagination.page || 1;
  const pageRange = useMemo(() => {
    const visibleCount = 5;
    const half = Math.floor(visibleCount / 2);
    let start = Math.max(1, currentPage - half);
    let end = start + visibleCount - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - visibleCount + 1);
    }
    const range = [];
    for (let i = start; i <= end; i += 1) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    setPagination((prev) => ({ ...prev, page: pageNumber }));
  };

  const handlePageSizeChange = (value) => {
    const nextSize = Number(value);
    if (!Number.isNaN(nextSize)) {
      setPagination((prev) => ({ ...prev, pageSize: nextSize, page: 1 }));
    }
  };

  const handleViewDetail = (row) => {
    if (!row?.inventoryId || !row?.partCode) return;
    const query = new URLSearchParams();
    if (row.serviceCenterId || serviceCenterId) {
      query.set("serviceCenterId", row.serviceCenterId || serviceCenterId);
    }
    navigate(
      `/manager/inventory/${encodeURIComponent(row.inventoryId)}/${encodeURIComponent(row.partCode)}${
        query.toString() ? `?${query.toString()}` : ""
      }`,
      {
        state: {
          source: "inventory-summary",
          serviceCenterInventoryName: row.serviceCenterInventoryName,
        },
      },
    );
  };

  const displayStart = pagination.total === 0 ? 0 : (currentPage - 1) * pagination.pageSize + 1;
  const displayEnd = Math.min(currentPage * pagination.pageSize, pagination.total);

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
                <th className="text-left px-5 py-3 w-16 font-semibold text-foreground">STT</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Mã phụ tùng</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Tên phụ tùng</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Số lượng tồn kho</th>
                <th className="text-left px-5 py-3 min-w-[260px] font-semibold text-foreground">Kho</th>
                <th className="text-left px-5 py-3 font-semibold text-foreground">Mô tả</th>
                <th className="text-left px-5 py-3 w-32 font-semibold text-foreground">Thao tác</th>
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
                visibleRows.map((r, idx) => {
                  const rowIndex = (tablePage - 1) * tablePageSize + idx;
                  const [line1, line2, line3] = String(r.warehouse || "").split("\n");
                  return (
                    <tr
                      key={r.id}
                      className="bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                    >
                      <td className="px-5 py-4 align-top text-sm font-medium text-muted-foreground first:rounded-l-xl">
                        {rowIndex + 1}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="text-primary font-semibold tracking-wide">
                          {r.partCode}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          {r.partImage ? (
                            <img
                              src={r.partImage}
                              alt={r.partName}
                              className="h-12 w-12 rounded-lg object-cover border border-border/60 shadow-sm"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="font-medium text-foreground line-clamp-2">{r.partName}</p>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                              Mã chuẩn: {r.partCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
                            {r.totalQty} bộ
                          </Badge>
                          {renderStatusBadge(r.status)}
                        </div>
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
                      <td className="px-5 py-4 align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleViewDetail(r)}
                        >
                          Xem chi tiết
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
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

        <div className="flex items-center justify-between mt-4 text-sm flex-wrap gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Hiển thị {rows.length === 0 ? 0 : (tablePage - 1) * tablePageSize + 1}-{Math.min(tablePage * tablePageSize, rows.length)} trong tổng {rows.length} phụ tùng
            </span>
            <div className="flex items-center gap-2">
              <span>Kích thước trang:</span>
              <Select value={String(tablePageSize)} onValueChange={(value) => {
                const nextSize = Number(value);
                if (!Number.isNaN(nextSize)) {
                  setTablePageSize(nextSize);
                  setTablePage(1);
                  setExpandedId(null);
                }
              }}>
                <SelectTrigger className="h-8 w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={tablePage <= 1}
              onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
            >
              Trước
            </Button>
            {(() => {
              const visibleCount = 5;
              const half = Math.floor(visibleCount / 2);
              let start = Math.max(1, tablePage - half);
              let end = start + visibleCount - 1;
              const totalPageCount = Math.max(1, Math.ceil(rows.length / tablePageSize));
              if (end > totalPageCount) {
                end = totalPageCount;
                start = Math.max(1, end - visibleCount + 1);
              }
              const range = [];
              for (let i = start; i <= end; i += 1) {
                range.push(i);
              }
              return (
              <>
                {range[0] > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTablePage(1)}
                    >
                      1
                    </Button>
                    {range[0] > 2 && <span className="text-muted-foreground">...</span>}
                  </>
                )}
                {range.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="sm"
                    variant={pageNumber === tablePage ? "default" : "outline"}
                    onClick={() => {
                      setTablePage(pageNumber);
                      setExpandedId(null);
                    }}
                  >
                    {pageNumber}
                  </Button>
                ))}
                {range[range.length - 1] < totalPageCount && (
                  <>
                    {range[range.length - 1] < totalPageCount - 1 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTablePage(totalPageCount)}
                    >
                      {totalPageCount}
                    </Button>
                  </>
                )}
              </>
              );
            })()}
            <Button
              size="sm"
              variant="outline"
              disabled={tablePage >= Math.max(1, Math.ceil(rows.length / tablePageSize))}
              onClick={() => setTablePage((prev) => Math.min(Math.max(1, Math.ceil(rows.length / tablePageSize)), prev + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


