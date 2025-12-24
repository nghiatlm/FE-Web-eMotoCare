import { Fragment, useMemo, useState, useEffect } from "react";
import { Search, Calendar, ChevronRight, ChevronDown, MapPin, User2, Phone, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getServiceCenterInventories } from "@/api/serviceCenterInventoriesApi";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371;
  const dLat = (parseFloat(lat2) - parseFloat(lat1)) * Math.PI / 180;
  const dLon = (parseFloat(lon2) - parseFloat(lon1)) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(parseFloat(lat1) * Math.PI / 180) * Math.cos(parseFloat(lat2) * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function InventorySummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [currentWarehouse, setCurrentWarehouse] = useState(null);

  useEffect(() => {
    const fetchCurrentWarehouse = async () => {
      try {
        const accountId = user?.accountResponse?.id;
        if (!accountId) return;

        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (staffData?.serviceCenterId) {
          setCurrentWarehouse({
            serviceCenterId: staffData.serviceCenterId,
            latitude: staffData.serviceCenter?.latitude,
            longitude: staffData.serviceCenter?.longitude,
          });
        }
      } catch (error) {
        console.error("Error fetching current warehouse:", error);
      }
    };

    if (user) {
      fetchCurrentWarehouse();
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getServiceCenterInventories({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: search || undefined,
          status: status !== "all" ? status.toUpperCase() : undefined,
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
  }, [pagination.page, pagination.pageSize, search, status]);

  const rows = useMemo(() => {
    const partCodeMap = new Map();

    inventories.forEach((inventory) => {
      const serviceCenter = inventory.serviceCenter || {};
      const storeKeeper = serviceCenter.staffs?.find((s) => s.position === "STORE_KEEPER");
      const warehouseInfo = `${serviceCenter.name || serviceCenter.code || ""}\n${serviceCenter.phone || ""}`.trim();
      const description = serviceCenter.description || inventory.serviceCenterInventoryName || "";

      (inventory.partItems || []).forEach((item) => {
        if (!item) return;

        const serialNumber = item.serialNumber || "";
        const serialParts = serialNumber.split("-");
        const serialPrefix = serialParts.length > 1 ? serialParts.slice(0, -1).join("-") : serialNumber;

        const partCode = item.part?.code || serialPrefix || serialNumber || item.id;
        const partName = item.part?.name || serialPrefix || serialNumber || "Phụ tùng";
        const partImage = item.part?.image || null;
        const partStatus = item.part?.status?.toLowerCase() || item.status?.toLowerCase() || inventory.status?.toLowerCase() || "active";

        if (!partCodeMap.has(partCode)) {
          partCodeMap.set(partCode, {
            partCode,
            partName,
            partImage,
            partStatus,
            branches: [],
            totalQty: 0,
          });
        }

        const partEntry = partCodeMap.get(partCode);
        
        let branchEntry = partEntry.branches.find((b) => b.inventoryId === inventory.id);
        if (!branchEntry) {
          branchEntry = {
            inventoryId: inventory.id,
            serviceCenterName: serviceCenter.name || serviceCenter.code || "",
            warehouse: warehouseInfo,
            description: description,
            latitude: serviceCenter.latitude,
            longitude: serviceCenter.longitude,
            totalQty: 0,
            items: [],
          };
          partEntry.branches.push(branchEntry);
        }

        branchEntry.items.push({
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

        branchEntry.totalQty += item.quantity || 1;
        partEntry.totalQty += item.quantity || 1;
        
        if (!partEntry.partImage && partImage) partEntry.partImage = partImage;
        if (partEntry.partName === serialPrefix && partName !== serialPrefix) {
          partEntry.partName = partName;
        }
        if (partEntry.partStatus === "active" && partStatus !== "active") {
          partEntry.partStatus = partStatus;
        }
      });
    });

    const transformedRows = Array.from(partCodeMap.values()).map((partData) => {
      let nearestBranch = null;
      let minDistance = Infinity;

      if (currentWarehouse?.latitude && currentWarehouse?.longitude) {
        partData.branches.forEach((branch) => {
          const lat = branch.latitude;
          const lon = branch.longitude;

          if (lat && lon) {
            const distance = calculateDistance(
              currentWarehouse.latitude,
              currentWarehouse.longitude,
              lat,
              lon
            );

            if (distance < minDistance) {
              minDistance = distance;
              nearestBranch = branch;
            }
          }
        });
      }

      if (!nearestBranch && partData.branches.length > 0) {
        nearestBranch = partData.branches[0];
      }

      return {
        id: `part-${partData.partCode}`,
        partCode: partData.partCode,
        partName: partData.partName,
        partImage: partData.partImage,
        totalQty: partData.totalQty,
        status: partData.partStatus || "active",
        branches: partData.branches,
        nearestWarehouse: nearestBranch?.warehouse || null,
      };
    });

    return transformedRows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.partCode.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q)
      );
    });
  }, [inventories, search, status, currentWarehouse]);

  useEffect(() => {
    setTablePage(1);
  }, [search, status, inventories.length]);

  const visibleRows = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return rows.slice(start, start + tablePageSize);
  }, [rows, tablePage, tablePageSize]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

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
    setExpandedId(null);
    setPagination((prev) => ({ ...prev, page: pageNumber }));
  };

  const handlePageSizeChange = (value) => {
    const nextSize = Number(value);
    if (!Number.isNaN(nextSize)) {
      setExpandedId(null);
      setPagination((prev) => ({ ...prev, pageSize: nextSize, page: 1 }));
    }
  };

  const displayStart = pagination.total === 0 ? 0 : (currentPage - 1) * pagination.pageSize + 1;
  const displayEnd = Math.min(currentPage * pagination.pageSize, pagination.total);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="mb-2">
          <div className="flex items-center gap-3 mb-2">
            <Boxes className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Kho tổng</h1>
          </div>
          <p className="text-base md:text-lg font-medium text-slate-700">
            Tổng quan tồn kho phụ tùng
          </p>
          <div className="mt-3 h-1.5 w-28 rounded-full bg-red-500 shadow-[0_4px_16px_-6px_rgba(239,68,68,0.65)]" />
        </div>

        <Card className="mb-2 shadow-sm rounded-xl border border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="relative flex-1 min-w-[260px] md:min-w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nhập từ mã/tên phụ tùng..."
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-red-500/70"
                />
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px] md:w-[180px] bg-slate-50 border-slate-200 focus-visible:ring-red-500/70">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Còn hàng</SelectItem>
                  <SelectItem value="out">Hết hàng</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline"
                className="border-transparent text-slate-600 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
              >
                Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <div className="min-w-[1100px]">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-red-60 via-red-10/80 to-red-100/60 border-b border-red-100">
                <th className="px-5 py-3 w-12"></th>
                <th className="text-center px-5 py-3 w-16 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  STT
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Hình ảnh
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Mã phụ tùng
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Tên phụ tùng
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Số lượng tồn kho
                </th>
                <th className="text-left px-5 py-3 min-w-[260px] text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Kho
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={7}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, idx) => {
                const rowIndex = (tablePage - 1) * tablePageSize + idx;
                const isExpanded = expandedId === r.id && r.branches?.length;
                const hasBranches = r.branches && r.branches.length > 0;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className={`border border-slate-100 hover:border-red-200 hover:shadow-md transition-all duration-200 ${
                        isExpanded ? "ring-1 ring-red-200 shadow-md bg-rose-50/40" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {hasBranches ? (
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
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-medium text-muted-foreground">
                        {rowIndex + 1}
                      </td>
                      {/* Hình ảnh */}
                      <td className="px-5 py-4 text-center">
                        {r.partImage ? (
                          <img
                            src={r.partImage}
                            alt={r.partName}
                            className="h-12 w-12 rounded-lg object-cover border border-border/60 shadow-sm mx-auto"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground mx-auto">
                            N/A
                          </div>
                        )}
                      </td>
                      {/* Mã phụ tùng */}
                      <td className="px-5 py-4 text-left">
                        <span className="text-primary font-semibold tracking-wide">
                          {r.partCode}
                        </span>
                      </td>
                      {/* Tên phụ tùng */}
                      <td className="px-5 py-4 text-left">
                        <p className="font-medium text-foreground line-clamp-2">{r.partName}</p>
                      </td>
                      {/* Số lượng + trạng thái */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
                            {r.totalQty}
                          </Badge>
                          <div className="flex justify-center">
                            {renderStatusBadge(r.status)}
                          </div>
                        </div>
                      </td>
                      {/* Kho gần nhất */}
                      <td className="px-5 py-4 text-left">
                        {r.nearestWarehouse ? (
                          <div className="flex flex-col items-start space-y-1.5 text-sm text-muted-foreground">
                            {r.nearestWarehouse.split("\n").map((line, idx) => {
                              if (!line) return null;
                              if (idx === 0) {
                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{line}</span>
                                  </div>
                                );
                              } else if (line.match(/^0\d{9}$/)) {
                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{line}</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasBranches ? (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={7} className="px-2">
                          <div className="mx-3 mb-2 rounded-2xl border border-border bg-gradient-to-br from-muted/40 to-background shadow-inner">
                            <div className="flex items-center justify-between px-6 py-3 border-b border-border/60">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Chi tiết serial
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {r.branches.reduce((sum, branch) => sum + (branch.items?.length || 0), 0)} số serial được quản lý cho phụ tùng này
                                </p>
                              </div>
                              <Badge variant="outline" className="px-3 py-1 text-xs">
                                Tổng {r.totalQty} bộ
                              </Badge>
                            </div>
                            <div className="overflow-x-auto pb-1">
                              <table className="w-full text-sm border-separate border-spacing-y-1">
                                <thead className="text-muted-foreground">
                                  <tr>
                                    <th className="text-center px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Mã phụ tùng
                                    </th>
                                    <th className="text-center px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Tên phụ tùng
                                    </th>
                                    <th className="text-center px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Số serial
                                    </th>
                                    <th className="text-center px-6 py-2 text-xs font-semibold uppercase tracking-wide">
                                      Số lượng tồn kho
                                    </th>
                                    <th className="text-center px-6 py-2 text-xs font-semibold uppercase tracking-wide min-w-[260px]">
                                      Kho
                                    </th>
                                    <th className="text-center px-6 py-2 text-xs font-semibold uppercase tracking-wide max-w-[200px]">
                                      Mô tả
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.branches.flatMap((branch) => {
                                    const [b1, b2, b3] = String(branch.warehouse || "").split("\n");
                                    return (branch.items || []).map((item, itemIdx) => (
                                      <tr
                                        key={item.id || `${branch.inventoryId}-${itemIdx}`}
                                        className="bg-card/90 border border-border/40 shadow-sm"
                                      >
                                        <td className="px-6 py-3 text-center text-primary font-semibold">
                                          {r.partCode}
                                        </td>
                                        <td className="px-6 py-3 text-center">{r.partName}</td>
                                        <td className="px-6 py-3 text-center text-primary/90 font-medium">
                                          {item.serialNumber || "—"}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                          <div className="flex items-center justify-center">
                                            <Badge variant="secondary" className="px-2">
                                              {item.quantity || item.qty || 1}
                                            </Badge>
                                          </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                          <div className="flex flex-col items-center space-y-1.5 text-sm text-muted-foreground">
                                            {b1 && (
                                              <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span>{b1}</span>
                                              </div>
                                            )}
                                            {b2 && (
                                              <div className="flex items-center gap-2">
                                                <User2 className="h-4 w-4" />
                                                <span>{b2}</span>
                                              </div>
                                            )}
                                            {b3 && (
                                              <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                <span>{b3}</span>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-6 py-3 text-center max-w-[200px]">
                                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 truncate">
                                            {branch.description || "—"}
                                          </p>
                                        </td>
                                      </tr>
                                    ));
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
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={7}>
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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


