import { useEffect, useState } from "react";
import { Search, RotateCcw, PackagePlus, MapPin, Building2, Image as ImageIcon, Eye, Edit, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { getParts, createPart, getPartTypes, updatePart, getPartById } from "@/api/partsApi";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const ColoredProgress = ({ value, colorClass, className, ...props }) => {
  return (
    <ProgressPrimitive.Root 
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)} 
      {...props}
    >
      <ProgressPrimitive.Indicator 
        className={cn("h-full w-full flex-1 transition-all", colorClass || "bg-primary")} 
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};

export default function AccessoryInventory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: "", name: "" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadingEditDetail, setLoadingEditDetail] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [partTypes, setPartTypes] = useState([]);
  const { toast } = useToast();

  const [createFormData, setCreateFormData] = useState({
    partTypeId: "",
    name: "",
    quantity: 0,
    image: ""
  });

  const [editFormData, setEditFormData] = useState({
    partTypeId: "",
    code: "",
    name: "",
    quantity: 0,
    image: "",
    status: "ACTIVE"
  });

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
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoading(true);
        const res = await getParts({ 
          page, 
          pageSize,
          search: search || undefined,
        });
        const payload = res?.data || res;
        const list = payload?.rowDatas || [];
        const totalCount = payload?.total || 0;
        
        const mapped = list.map((p) => {
          const minStock = 10;
          const alert = p?.quantity === 0 ? "out" : p?.quantity < minStock ? "low" : "sufficient";
          return {
            id: p?.id || p?.code,
            code: p?.code || "",
            name: p?.name || "",
            image: p?.image || "",
            partType: p?.partType?.name || "",
            partTypeId: p?.partType?.id || "",
            quantity: p?.quantity || 0,
            status: p?.status || "",
            alert: alert,
            minStock: minStock,
          };
        });
        setAccessories(mapped);
        setTotal(totalCount);
      } catch (e) {
        console.error("Lỗi lấy danh sách parts:", e);
        setAccessories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [page, pageSize, search, status]);

  useEffect(() => {
    const fetchPartTypes = async () => {
      if (isCreateDialogOpen || isEditDialogOpen) {
        try {
          const res = await getPartTypes(1, 100);
          const list = res?.data?.rowDatas || res?.rowDatas || [];
          setPartTypes(list);
        } catch (e) {
          console.error("Lỗi lấy danh sách loại phụ tùng:", e);
        }
      } else {
        setPartTypes([]);
      }
    };
    fetchPartTypes();
  }, [isCreateDialogOpen, isEditDialogOpen]);

  useEffect(() => {
    const fetchPartDetail = async () => {
      if (isEditDialogOpen && selectedPartId) {
        if (partTypes.length === 0) {
          return;
        }

        try {
          setLoadingEditDetail(true);
          const response = await getPartById(selectedPartId);
          
          const data = response?.data || response;
          
          if (data) {
            let partTypeId = "";
            if (data.partType?.id) {
              partTypeId = data.partType.id;
            } else if (data.partTypeId) {
              partTypeId = data.partTypeId;
            }
            
            console.log("Part detail data:", data);
            console.log("Extracted partTypeId:", partTypeId);
            console.log("Available partTypes:", partTypes.map(t => ({ id: t.id, name: t.name })));
            
            setEditFormData({
              partTypeId: partTypeId,
              code: data.code || "",
              name: data.name || "",
              quantity: data.quantity || 0,
              image: data.image || "",
              status: data.status || "ACTIVE"
            });
          }
        } catch (error) {
          console.error("Lỗi lấy chi tiết phụ tùng:", error);
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin phụ tùng",
            variant: "destructive"
          });
          setIsEditDialogOpen(false);
        } finally {
          setLoadingEditDetail(false);
        }
      }
    };
    fetchPartDetail();
  }, [isEditDialogOpen, selectedPartId, partTypes, toast]);

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
        return "Sắp hết";
      case "out":
        return "Hết";
      default:
        return status;
    }
  };

  const getProgressColor = (stock, minStock) => {
    const ratio = stock / minStock;

    if (stock === 0 || ratio < 0.5) {
      return "bg-red-500";
    }
    if (ratio >= 0.5 && ratio <= 1.1) {
      return "bg-yellow-500";
    }
    return "bg-green-500";
  };

  const filteredAccessories = accessories.filter(item => {
    if (status && status !== "all") {
      return item.alert === status;
    }
    return true;
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
                <SelectValue placeholder="Mức cảnh báo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sufficient">Đủ</SelectItem>
                <SelectItem value="low">Sắp hết</SelectItem>
                <SelectItem value="out">Hết</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                setPage(1);
              }}
            >
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
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Tạo phụ tùng
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
                          <div className="relative h-12 w-12">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="h-12 w-12 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setSelectedImage({ url: item.image, name: item.name });
                                  setIsImageDialogOpen(true);
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentElement.querySelector('.image-fallback');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div className={`image-fallback h-12 w-12 bg-muted rounded flex items-center justify-center ${item.image ? 'hidden' : 'flex'}`}>
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-foreground">{item.code}</td>
                        <td className="py-4 px-6 text-sm text-foreground">{item.name}</td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">{item.partType || "—"}</td>
                      <td className="py-4 px-6 text-sm text-center">{item.quantity}</td>
                      <td className="py-4 px-6">
                        <div className="w-36 space-y-1">
                          <ColoredProgress 
                            value={Math.max(0, Math.min(100, (item.quantity / item.minStock) * 100))} 
                            colorClass={getProgressColor(item.quantity, item.minStock)}
                            className="h-2"
                          />
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Min: {item.minStock}</span>
                            {item.quantity < item.minStock ? (
                              <span className="text-orange-600 font-medium">
                                Sắp hết: {item.minStock - item.quantity}
                              </span>
                            ) : item.quantity > item.minStock * 1.1 ? (
                              <span className="text-green-600 font-medium">
                                Dư: {item.quantity - item.minStock}
                              </span>
                            ) : null}
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
                              onClick={() => {
                                setSelectedPartId(item.id);
                                setIsEditDialogOpen(true);
                              }}
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
            Hiển thị {filteredAccessories.length} / {total} phụ tùng
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ‹
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-white">
              {page}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page * pageSize >= total}
              onClick={() => setPage(p => p + 1)}
            >
              ›
            </Button>
            <Select 
              value={String(pageSize)} 
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
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

      {/* Create Part Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setCreateFormData({
            partTypeId: "",
            name: "",
            quantity: 0,
            image: ""
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Plus className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-2xl">Tạo phụ tùng mới</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partTypeId">Loại phụ tùng *</Label>
              <Select 
                value={createFormData.partTypeId} 
                onValueChange={(value) => setCreateFormData({ ...createFormData, partTypeId: value })}
              >
                <SelectTrigger id="partTypeId">
                  <SelectValue placeholder="Chọn loại phụ tùng" />
                </SelectTrigger>
                <SelectContent>
                  {partTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Tên phụ tùng *</Label>
              <Input
                id="name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                placeholder="Nhập tên phụ tùng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={createFormData.quantity}
                onChange={(e) => setCreateFormData({ ...createFormData, quantity: parseInt(e.target.value) || 0 })}
                placeholder="Nhập số lượng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL hình ảnh</Label>
              <Input
                id="image"
                value={createFormData.image}
                onChange={(e) => setCreateFormData({ ...createFormData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {createFormData.image && (
                <div className="mt-2">
                  <img 
                    src={createFormData.image} 
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded border border-border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setCreateFormData({
                  partTypeId: "",
                  name: "",
                  quantity: 0,
                  image: ""
                });
              }}
            >
              Hủy
            </Button>
            <Button 
              className="gap-2 bg-amber-600 hover:bg-amber-700"
              onClick={async () => {
                if (!createFormData.partTypeId || !createFormData.name || createFormData.quantity < 0) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng điền đầy đủ thông tin bắt buộc",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  setCreating(true);
                  const response = await createPart({
                    partTypeId: createFormData.partTypeId,
                    name: createFormData.name,
                    quantity: createFormData.quantity,
                    image: createFormData.image || null
                  });

                  toast({
                    title: "Thành công",
                    description: "Tạo phụ tùng mới thành công",
                  });

                  setIsCreateDialogOpen(false);
                  setCreateFormData({
                    partTypeId: "",
                    name: "",
                    quantity: 0,
                    image: ""
                  });

                  const res = await getParts({ page, pageSize, search: search || undefined });
                  const payload = res?.data || res;
                  const list = payload?.rowDatas || [];
                  const totalCount = payload?.total || 0;
                  
                  const mapped = list.map((p) => {
                    const minStock = 10;
                    const alert = p?.quantity === 0 ? "out" : p?.quantity < minStock ? "low" : "sufficient";
                    return {
                      id: p?.id || p?.code,
                      code: p?.code || "",
                      name: p?.name || "",
                      image: p?.image || "",
                      partType: p?.partType?.name || "",
                      partTypeId: p?.partType?.id || "",
                      quantity: p?.quantity || 0,
                      status: p?.status || "",
                      alert: alert,
                      minStock: minStock,
                    };
                  });
                  setAccessories(mapped);
                  setTotal(totalCount);
                } catch (error) {
                  console.error("Lỗi tạo phụ tùng:", error);
                  toast({
                    title: "Lỗi",
                    description: error?.message || "Không thể tạo phụ tùng mới",
                    variant: "destructive"
                  });
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating}
            >
              {creating ? "Đang tạo..." : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Part Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedPartId(null);
          setEditFormData({
            partTypeId: "",
            code: "",
            name: "",
            quantity: 0,
            image: "",
            status: "ACTIVE"
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Chỉnh sửa phụ tùng</DialogTitle>
            </div>
          </DialogHeader>

          {loadingEditDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p className="text-sm text-muted-foreground">Đang tải thông tin...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                                 <div className="space-y-2">
                   <Label htmlFor="edit-partTypeId">Loại phụ tùng *</Label>
                   <Select 
                     key={`part-type-${editFormData.partTypeId || 'empty'}`}
                     value={editFormData.partTypeId || ""} 
                     onValueChange={(value) => setEditFormData({ ...editFormData, partTypeId: value })}
                   >
                     <SelectTrigger id="edit-partTypeId">
                       <SelectValue placeholder="Chọn loại phụ tùng">
                         {editFormData.partTypeId && partTypes.find(t => t.id === editFormData.partTypeId)?.name}
                       </SelectValue>
                     </SelectTrigger>
                     <SelectContent>
                       {partTypes.map((type) => (
                         <SelectItem key={type.id} value={type.id}>
                           {type.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-code">Mã phụ tùng *</Label>
                  <Input
                    id="edit-code"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    placeholder="Nhập mã phụ tùng"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tên phụ tùng *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Nhập tên phụ tùng"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Số lượng *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="0"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="Nhập số lượng"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-image">URL hình ảnh</Label>
                  <Input
                    id="edit-image"
                    value={editFormData.image}
                    onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {editFormData.image && (
                    <div className="mt-2">
                      <img 
                        src={editFormData.image} 
                        alt="Preview"
                        className="h-24 w-24 object-cover rounded border border-border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Trạng thái *</Label>
                  <Select 
                    value={editFormData.status} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedPartId(null);
                    setEditFormData({
                      partTypeId: "",
                      code: "",
                      name: "",
                      quantity: 0,
                      image: "",
                      status: "ACTIVE"
                    });
                  }}
                  disabled={editing}
                >
                  Hủy
                </Button>
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={async () => {
                    if (!editFormData.partTypeId || !editFormData.code || !editFormData.name || editFormData.quantity < 0) {
                      toast({
                        title: "Lỗi",
                        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      setEditing(true);
                      const response = await updatePart(selectedPartId, {
                        partTypeId: editFormData.partTypeId,
                        code: editFormData.code,
                        name: editFormData.name,
                        quantity: editFormData.quantity,
                        image: editFormData.image || null,
                        status: editFormData.status
                      });

                      toast({
                        title: "Thành công",
                        description: "Cập nhật phụ tùng thành công",
                      });

                      setIsEditDialogOpen(false);
                      setSelectedPartId(null);
                      setEditFormData({
                        partTypeId: "",
                        code: "",
                        name: "",
                        quantity: 0,
                        image: "",
                        status: "ACTIVE"
                      });

                      const res = await getParts({ page, pageSize, search: search || undefined });
                      const payload = res?.data || res;
                      const list = payload?.rowDatas || [];
                      const totalCount = payload?.total || 0;
                      
                      const mapped = list.map((p) => {
                        const minStock = 10;
                        const alert = p?.quantity === 0 ? "out" : p?.quantity < minStock ? "low" : "sufficient";
                        return {
                          id: p?.id || p?.code,
                          code: p?.code || "",
                          name: p?.name || "",
                          image: p?.image || "",
                          partType: p?.partType?.name || "",
                          partTypeId: p?.partType?.id || "",
                          quantity: p?.quantity || 0,
                          status: p?.status || "",
                          alert: alert,
                          minStock: minStock,
                        };
                      });
                      setAccessories(mapped);
                      setTotal(totalCount);
                    } catch (error) {
                      console.error("Lỗi cập nhật phụ tùng:", error);
                      toast({
                        title: "Lỗi",
                        description: error?.message || "Không thể cập nhật phụ tùng",
                        variant: "destructive"
                      });
                    } finally {
                      setEditing(false);
                    }
                  }}
                  disabled={editing}
                >
                  {editing ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedImage.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
            {selectedImage.url ? (
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  e.target.src = '';
                  e.target.alt = 'Không thể tải hình ảnh';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không có hình ảnh</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

