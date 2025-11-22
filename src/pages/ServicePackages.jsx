import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Package, Calendar as CalendarIcon, Tag, DollarSign, Wrench, Info, Hash, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ServicePackagesTable from "@/components/ServicePackagesTable";
import { updatePriceService } from "@/api/priceServicesApi";
import { getPartTypes, getPartTypeById } from "@/api/partsApi";
import { useToast } from "@/hooks/use-toast";

export default function ServicePackages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [partTypes, setPartTypes] = useState([]);
  const [loadingPartTypes, setLoadingPartTypes] = useState(false);
  const [selectedPartType, setSelectedPartType] = useState(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    partTypeId: "",
    code: "",
    remedies: "REPAIR",
    name: "",
    laborCost: "",
    effectiveDate: null,
    price: "",
    description: "",
  });

  const resetForm = () => {
    setForm({
      partTypeId: "",
      code: "",
      remedies: "REPAIR",
      name: "",
      laborCost: "",
      effectiveDate: null,
      price: "",
      description: "",
    });
  };

  // Map category to remedies (for backward compatibility)
  const mapCategoryToRemedies = (category) => {
    const map = {
      "Repair": "REPAIR",
      "Maintenance": "REPAIR",
      "Warranty": "REPAIR",
      "Upgrade": "REPAIR"
    };
    return map[category] || "REPAIR";
  };

  // Map remedies to display label
  const getRemediesLabel = (remedies) => {
    const map = {
      "REPAIR": "Sửa chữa",
      "REPLACE": "Thay thế",
      "CHECK": "Kiểm tra",
      "NONE": "Không có"
    };
    return map[remedies] || remedies;
  };

  // Fetch part types
  useEffect(() => {
    const fetchPartTypes = async () => {
      try {
        setLoadingPartTypes(true);
        const response = await getPartTypes(1, 100);
        if (response.success && response.data) {
          const types = response.data.rowDatas || response.data || [];
          setPartTypes(types);
        }
      } catch (error) {
        console.error("Error fetching part types:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách loại phụ tùng",
          variant: "destructive"
        });
      } finally {
        setLoadingPartTypes(false);
      }
    };

    fetchPartTypes();
  }, []);

  // Fetch part type detail when viewing
  useEffect(() => {
    const fetchPartTypeDetail = async () => {
      if (selected?.rawData?.partTypeId && isViewOpen) {
        try {
          const response = await getPartTypeById(selected.rawData.partTypeId);
          if (response.success && response.data) {
            setSelectedPartType(response.data);
          }
        } catch (error) {
          console.error("Error fetching part type detail:", error);
        }
      }
    };

    fetchPartTypeDetail();
  }, [selected, isViewOpen]);

  useEffect(() => {
    window.openEditServicePackage = (row) => {
      setSelected(row);
      const rawData = row.rawData || {};
      const effectiveDate = rawData.effectiveDate ? new Date(rawData.effectiveDate) : null;
      setForm({
        partTypeId: rawData.partTypeId || "",
        code: rawData.code || row.id || "",
        remedies: rawData.remedies || mapCategoryToRemedies(row.category) || "REPAIR",
        name: row.name || "",
        laborCost: rawData.laborCost?.toString() || "",
        effectiveDate: effectiveDate,
        price: rawData.price?.toString() || row.price?.replace(/,/g, "") || "",
        description: row.description || "",
      });
      setIsEditOpen(true);
    };
    window.openViewServicePackage = (row) => {
      setSelected(row);
      setIsViewOpen(true);
    };
    return () => {
      if (window.openEditServicePackage) delete window.openEditServicePackage;
      if (window.openViewServicePackage) delete window.openViewServicePackage;
    };
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;

    // Validation
    if (!form.partTypeId || form.partTypeId.trim() === "") {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn loại phụ tùng",
        variant: "destructive"
      });
      return;
    }

    if (!form.name || !form.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên dịch vụ",
        variant: "destructive"
      });
      return;
    }

    if (!form.price || parseInt(form.price) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá dịch vụ hợp lệ (lớn hơn 0)",
        variant: "destructive"
      });
      return;
    }

    const priceNum = parseInt(form.price);
    if (isNaN(priceNum) || priceNum > 1000000000) {
      toast({
        title: "Lỗi",
        description: "Giá không được vượt quá 1 tỷ VNĐ",
        variant: "destructive"
      });
      return;
    }

    if (form.laborCost && form.laborCost.trim() !== "") {
      const laborCostNum = parseInt(form.laborCost);
      if (isNaN(laborCostNum) || laborCostNum < 0 || laborCostNum > 1000000000) {
        toast({
          title: "Lỗi",
          description: "Chi phí lao động phải là số hợp lệ từ 0 đến 1 tỷ VNĐ",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setSaving(true);
      const rawData = selected.rawData || {};
      const serviceId = rawData.id || selected.id;

      if (!serviceId) {
        throw new Error("Không tìm thấy ID của dịch vụ cần cập nhật");
      }

      // Combine date and time
      let effectiveDateISO = rawData.effectiveDate || new Date().toISOString();
      if (form.effectiveDate) {
        const dateStr = format(form.effectiveDate, "yyyy-MM-dd");
        effectiveDateISO = new Date(`${dateStr}T00:00:00`).toISOString();
      }

      const payload = {
        partTypeId: form.partTypeId || rawData.partTypeId,
        remedies: form.remedies || "REPAIR",
        name: form.name.trim(),
        laborCost: parseInt(form.laborCost) || 0,
        effectiveDate: effectiveDateISO,
        price: parseInt(form.price) || 0,
        description: form.description?.trim() || ""
      };
      
      // Include code if provided or if it exists in rawData
      if (form.code && form.code.trim()) {
        payload.code = form.code.trim();
      } else if (rawData.code) {
        payload.code = rawData.code;
      }

      console.log("📤 Updating price service with payload:", payload);
      console.log("📤 Service ID:", serviceId);

      const response = await updatePriceService(serviceId, payload);
      
      console.log("📥 Update price service response:", response);

      // Handle response - API returns { statusCode, success, message, data }
      if (response?.success || response?.statusCode === 200) {
        toast({
          title: "Thành công",
          description: response?.message || "Cập nhật bảng giá dịch vụ thành công",
        });
        setIsEditOpen(false);
        setSelected(null);
        resetForm();
        // Refresh table
        if (window.refreshPriceServices) {
          window.refreshPriceServices();
        }
      } else {
        throw new Error(response?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("❌ Error updating price service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || "Không thể cập nhật bảng giá dịch vụ. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-6 shadow-lg mb-6">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg border border-white/20">
                <Package className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                  Quản lý gói dịch vụ
                </h1>
                <p className="text-muted-foreground text-sm">
                  Quản lý các gói dịch vụ và bảng giá dịch vụ trong hệ thống
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border border-border/60 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã, tên, mô tả..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 border border-border/60 focus:border-primary transition-colors"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[200px] h-11 border border-border/60 focus:border-primary transition-colors">
                  <SelectValue placeholder="Loại dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="Maintenance">Bảo dưỡng</SelectItem>
                  <SelectItem value="Repair">Sửa chữa</SelectItem>
                  <SelectItem value="Warranty">Bảo hành</SelectItem>
                  <SelectItem value="Upgrade">Nâng cấp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px] h-11 border border-border/60 focus:border-primary transition-colors">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>

            {(category || status || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("");
                  setStatus("");
                  setSearch("");
                }}
                className="text-primary hover:text-primary/90"
              >
                Clear Filters
              </Button>
            )}

              <div className="flex items-center gap-3 ml-auto">
                <Button
                  className="gap-2 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                  onClick={() => navigate("/admin/service-packages/create")}
                >
                  <Plus className="h-4 w-4" />
                  Thêm gói dịch vụ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ServicePackagesTable search={search} category={category} status={status} />

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Loại phụ tùng <span className="text-red-500">*</span></Label>
                <Select 
                  value={form.partTypeId} 
                  onValueChange={(value) => setForm((f) => ({ ...f, partTypeId: value }))}
                  disabled={loadingPartTypes}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPartTypes ? "Đang tải..." : "Chọn loại phụ tùng"} />
                  </SelectTrigger>
                  <SelectContent>
                    {partTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} {type.description && `- ${type.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mã</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="VD: PriceSV-00001"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên dịch vụ <span className="text-red-500">*</span></Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input 
                  value={form.description} 
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá (VNĐ) <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number"
                    value={form.price} 
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chi phí lao động (VNĐ)</Label>
                  <Input 
                    type="number"
                    value={form.laborCost} 
                    onChange={(e) => setForm((f) => ({ ...f, laborCost: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại dịch vụ <span className="text-red-500">*</span></Label>
                  <Select value={form.remedies} onValueChange={(v) => setForm((f) => ({ ...f, remedies: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPAIR">Sửa chữa</SelectItem>
                      <SelectItem value="REPLACE">Thay thế</SelectItem>
                      <SelectItem value="CHECK">Kiểm tra</SelectItem>
                      <SelectItem value="NONE">Không có</SelectItem>
                    </SelectContent>
                  </Select> 
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Ngày hiệu lực
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.effectiveDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.effectiveDate ? (
                          format(form.effectiveDate, "dd/MM/yyyy", { locale: vi })
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={form.effectiveDate}
                        onSelect={(date) => setForm((f) => ({ ...f, effectiveDate: date }))}
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setIsEditOpen(false); setSelected(null); }}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={(o) => { 
          setIsViewOpen(o); 
          if (!o) {
            setSelected(null);
            setSelectedPartType(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Chi tiết bảng giá dịch vụ
                </DialogTitle>
                {selected?.remedies && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {getRemediesLabel(selected.remedies)}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Thông tin cơ bản */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Mã dịch vụ</span>
                      </div>
                      <p className="text-base font-semibold text-foreground">{selected?.id || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Tên dịch vụ</span>
                      </div>
                      <p className="text-base font-semibold text-foreground">{selected?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Mô tả</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                      {selected?.description || "Không có mô tả"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Thông tin giá */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Thông tin giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Giá dịch vụ</span>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {selected?.price || "0₫"}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        <span>Chi phí lao động</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {selected?.rawData?.laborCost 
                          ? new Intl.NumberFormat('vi-VN').format(selected.rawData.laborCost) + "₫"
                          : "0₫"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Thông tin khác
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Ngày hiệu lực</span>
                      </div>
                      <p className="text-base font-medium text-foreground">
                        {selected?.duration || "—"}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        <span>Loại xử lý</span>
                      </div>
                      <div>
                        {selected?.remedies ? (
                          <Badge className="text-sm">
                            {getRemediesLabel(selected.remedies)}
                          </Badge>
                        ) : (
                          <span className="text-base font-medium text-foreground">—</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Loại phụ tùng</span>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {selectedPartType?.name || selected?.partTypeName || "—"}
                        </p>
                        {selectedPartType?.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedPartType.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

