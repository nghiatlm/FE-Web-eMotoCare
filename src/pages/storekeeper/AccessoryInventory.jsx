import { useEffect, useState } from "react";
import { Search, RotateCcw, PackagePlus, MapPin, Building2, Image as ImageIcon, Eye, Edit, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { getParts } from "@/api/partsApi";

export default function AccessoryInventory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestNote, setRequestNote] = useState("");

  const currentBranch = {
    id: "BR-001",
    name: "GreenWheel - Chi nhánh Hồ Chí Minh",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    manager: "Dũng"
  };

  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoading(true);
        const res = await getParts({ page, pageSize });
        const list = res?.data?.rowDatas || res?.rowDatas || [];
        const mapped = list.map((p) => {
          const minStock = 5;
          const alert = p?.quantity === 0 ? "out" : p?.quantity < minStock ? "low" : "sufficient";
          return {
            id: p?.id || p?.code,
            name: p?.name,
            image: p?.image || "",
            //unit: "Cái",
            quantity: p?.quantity,
            status: p?.status,
            alert: alert,
          };
        });
        setAccessories(mapped);
      } catch (e) {
        console.error("Lỗi lấy danh sách parts:", e);
        setAccessories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [page, pageSize]);

  const getStockStatusBadge = (status) => {
    const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "sufficient":
        return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case "low":
        return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400`;
      case "out":
        return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      default:
        return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const getBackendStatusBadge = (status) => {
    const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
    switch ((status || "").toUpperCase()) {
      case "ACTIVE":
        return `${base} bg-green-50 text-green-700 ring-1 ring-green-200`;
      case "IN_ACTIVE":
      case "INACTIVE":
        return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`;
      default:
        return `${base} bg-gray-50 text-gray-700 ring-1 ring-gray-200`;
    }
  };

  const getAlertTextColor = (alert) => {
    switch (alert) {
      case "out":
        return "text-rose-600"; // đỏ
      case "low":
        return "text-amber-600"; // vàng
      default:
        return "text-green-600"; // xanh lá
    }
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case "sufficient":
        return "Đủ";
      case "low":
        return "Sắp thiếu";
      case "out":
        return "Hết";
      default:
        return status;
    }
  };

  const getProgressBarColor = (stock, minStock, status) => {
    if (status === "out") return "bg-gray-400";
    const percentage = (stock / minStock) * 100;
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const filteredAccessories = accessories.filter(item => {
    const matchesSearch = !search || 
      item.id.toLowerCase().includes(search.toLowerCase()) || 
      item.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !status || status === "all" || item.status === status;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <PackagePlus className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Tồn kho phụ tùng</h1>
          </div>
          <p className="text-muted-foreground mb-4">Quản lý tồn kho phụ tùng tại chi nhánh</p>
          
          {/* Chi nhánh hiện tại */}
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{currentBranch.name}</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      Chi nhánh của tôi
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{currentBranch.address}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Quản lý: <span className="font-medium text-foreground">{currentBranch.manager}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 bg-card rounded-lg border border-border mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã hoặc tên phụ tùng"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sufficient">Đủ</SelectItem>
                <SelectItem value="low">Sắp thiếu</SelectItem>
                <SelectItem value="out">Hết</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Làm mới
            </Button>

            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus(""); }} className="text-muted-foreground">
              Xoá lọc
            </Button>

            {isSelectMode ? (
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => { setIsSelectMode(false); setSelectedItems([]); }}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button 
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsRequestDialogOpen(true)}
                >
                  <Check className="h-4 w-4" />
                  Đã chọn ({selectedItems.length})
                </Button>
              </div>
            ) : (
              <Button 
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white ml-auto"
                onClick={() => setIsSelectMode(true)}
              >
                <PackagePlus className="h-4 w-4" />
                Chọn phụ tùng
              </Button>
            )}
          </div>
        </div>

        {/* Accessory Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {isSelectMode && <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground w-12"></th>}
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Hình ảnh</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mã phụ tùng</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tên phụ tùng</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Loại</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-muted-foreground">Số lượng</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mức cảnh báo</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
                  {!isSelectMode && <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAccessories.length === 0 ? (
                  <tr>
                    <td colSpan={isSelectMode ? "8" : "9"} className="py-12 px-6 text-center text-sm text-muted-foreground">
                      Không tìm thấy phụ tùng
                    </td>
                  </tr>
                ) : (
                  filteredAccessories.map((item, index) => {
                    const canSelect = item.status === "low" || item.status === "out";
                    const isSelected = selectedItems.includes(item.id);
                    
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-yellow-50/30"
                        } ${isSelected ? "bg-blue-50/50" : ""}`}
                      >
                        {isSelectMode && (
                          <td className="py-4 px-6">
                            {canSelect ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedItems([...selectedItems, item.id]);
                                  } else {
                                    setSelectedItems(selectedItems.filter(id => id !== item.id));
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}
                        <td className="py-4 px-6">
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-foreground">{item.code || item.id}</td>
                      <td className="py-4 px-6 text-sm text-foreground">{item.name}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{item.partType || "—"}</td>
                      <td className="py-4 px-6 text-sm text-center">{item.quantity}</td>
                      <td className="py-4 px-6">
                        <div className="w-36 space-y-1">
                          <Progress 
                            value={Math.max(0, Math.min(100, (item.quantity / item.minStock) * 100))} 
                            className="h-2"
                          />
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Min: {item.minStock}</span>
                            <span className={getAlertTextColor(item.alert)}>
                              {item.alert === "out"
                                ? `Thiếu: ${Math.max(0, item.minStock - item.quantity)}`
                                : item.alert === "low"
                                ? `Sắp thiếu: ${Math.max(0, item.minStock - item.quantity)}`
                                : "Đủ"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={getStockStatusBadge(item.alert)}>
                          {getStockStatusText(item.alert)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={getBackendStatusBadge(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      {!isSelectMode && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => navigate(`/storekeeper/accessories/${item.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              Chi tiết
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1 text-primary"
                            >
                              <Edit className="h-4 w-4" />
                              Điều chỉnh
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {filteredAccessories.length} phụ tùng
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>‹</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
            <Button variant="outline" size="sm">›</Button>
            <Select defaultValue="10">
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transfer Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <DialogTitle className="text-2xl">Chi tiết Yêu cầu chuyển hàng</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Summary Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Số lượng phụ tùng:</p>
                  <p className="text-4xl font-bold text-orange-600">{selectedItems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Trung tâm yêu cầu:</p>
                  <p className="text-lg font-semibold text-foreground">{currentBranch.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {currentBranch.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Parts List */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Danh sách phụ tùng cần chuyển</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mã phụ tùng</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tên phụ tùng</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">SL còn lại</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ngưỡng min</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Chi nhánh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loading ? [] : accessories)
                      .filter(item => selectedItems.includes(item.id))
                      .map((item, index) => {
                        const needQuantity = Math.max(0, item.minStock - item.availableStock);
                        return (
                          <tr key={item.id} className={`border-b border-border ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}`}>
                            <td className="py-3 px-4 text-sm font-medium text-foreground">{item.id}</td>
                            <td className="py-3 px-4 text-sm text-foreground">{item.name}</td>
                            <td className="py-3 px-4 text-sm text-center">
                              <span className={`font-bold ${item.availableStock === 0 ? "text-red-600" : "text-red-600"}`}>
                                {item.availableStock}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{item.minStock}</span>
                                <span className="text-xs text-red-600 font-medium">Cần: {needQuantity}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getStockStatusBadge(item.status)}>
                                {getStockStatusText(item.status)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-foreground">{item.branch}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Request Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Ghi chú yêu cầu *</Label>
              <Textarea
                placeholder="Nhập lý do và ghi chú cho yêu cầu chuyển hàng..."
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {requestNote.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsRequestDialogOpen(false); setRequestNote(""); }}>
              Hủy
            </Button>
            <Button 
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                // Handle send request
                console.log("Sending transfer request:", selectedItems, requestNote);
                setIsRequestDialogOpen(false);
                setIsSelectMode(false);
                setSelectedItems([]);
                setRequestNote("");
              }}
            >
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

