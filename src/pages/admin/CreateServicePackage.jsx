import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Package, Calendar as CalendarIcon, Clock, DollarSign, Wrench, Tag, FileText, Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createPriceService } from "@/api/priceServicesApi";
import { getPartTypes } from "@/api/partsApi";
import { toast } from "react-toastify";

export default function CreateServicePackage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [partTypes, setPartTypes] = useState([]);
  const [loadingPartTypes, setLoadingPartTypes] = useState(false);
  const [errors, setErrors] = useState({});

  // Get partTypeId from navigation state
  const { partTypeId: preSelectedPartTypeId, partTypeName: preSelectedPartTypeName } = location.state || {};

  const [form, setForm] = useState({
    partTypeId: preSelectedPartTypeId || "",
    code: "",
    remedies: "REPAIR",
    name: "",
    laborCost: "",
    effectiveDate: null,
    effectiveTime: "",
    price: "",
    description: "",
  });

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "partTypeId":
        if (!value || value.trim() === "") {
          newErrors.partTypeId = "Vui lòng chọn loại phụ tùng";
        } else {
          delete newErrors.partTypeId;
        }
        break;
      
      case "name":
        if (!value || value.trim() === "") {
          newErrors.name = "Vui lòng nhập tên dịch vụ";
        } else if (value.trim().length < 3) {
          newErrors.name = "Tên dịch vụ phải có ít nhất 3 ký tự";
        } else {
          delete newErrors.name;
        }
        break;
      
      case "price":
        if (!value || value.trim() === "") {
          newErrors.price = "Vui lòng nhập giá dịch vụ";
        } else {
          const priceNum = parseInt(value);
          if (isNaN(priceNum)) {
            newErrors.price = "Giá phải là số hợp lệ";
          } else if (priceNum <= 0) {
            newErrors.price = "Giá phải lớn hơn 0";
          } else if (priceNum > 1000000000) {
            newErrors.price = "Giá không được vượt quá 1 tỷ VNĐ";
          } else {
            delete newErrors.price;
          }
        }
        break;
      
      case "laborCost":
        if (value && value.trim() !== "") {
          const laborCostNum = parseInt(value);
          if (isNaN(laborCostNum)) {
            newErrors.laborCost = "Chi phí lao động phải là số hợp lệ";
          } else if (laborCostNum < 0) {
            newErrors.laborCost = "Chi phí lao động không được âm";
          } else if (laborCostNum > 1000000000) {
            newErrors.laborCost = "Chi phí lao động không được vượt quá 1 tỷ VNĐ";
          } else {
            delete newErrors.laborCost;
          }
        } else {
          delete newErrors.laborCost;
        }
        break;
      
      case "code":
        if (value && value.trim() !== "") {
          if (value.trim().length > 50) {
            newErrors.code = "Mã không được vượt quá 50 ký tự";
          } else {
            delete newErrors.code;
          }
        } else {
          delete newErrors.code;
        }
        break;
      
      case "description":
        if (value && value.trim().length > 500) {
          newErrors.description = "Mô tả không được vượt quá 500 ký tự";
        } else {
          delete newErrors.description;
        }
        break;
      
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.partTypeId || form.partTypeId.trim() === "") {
      newErrors.partTypeId = "Vui lòng chọn loại phụ tùng";
    }
    
    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Vui lòng nhập tên dịch vụ";
    } else if (form.name.trim().length < 3) {
      newErrors.name = "Tên dịch vụ phải có ít nhất 3 ký tự";
    }
    
    if (!form.price || form.price.trim() === "") {
      newErrors.price = "Vui lòng nhập giá dịch vụ";
    } else {
      const priceNum = parseInt(form.price);
      if (isNaN(priceNum)) {
        newErrors.price = "Giá phải là số hợp lệ";
      } else if (priceNum <= 0) {
        newErrors.price = "Giá phải lớn hơn 0";
      } else if (priceNum > 1000000000) {
        newErrors.price = "Giá không được vượt quá 1 tỷ VNĐ";
      }
    }
    
    if (form.laborCost && form.laborCost.trim() !== "") {
      const laborCostNum = parseInt(form.laborCost);
      if (isNaN(laborCostNum)) {
        newErrors.laborCost = "Chi phí lao động phải là số hợp lệ";
      } else if (laborCostNum < 0) {
        newErrors.laborCost = "Chi phí lao động không được âm";
      } else if (laborCostNum > 1000000000) {
        newErrors.laborCost = "Chi phí lao động không được vượt quá 1 tỷ VNĐ";
      }
    }
    
    if (form.code && form.code.trim() !== "" && form.code.trim().length > 50) {
      newErrors.code = "Mã không được vượt quá 50 ký tự";
    }
    
    if (form.description && form.description.trim().length > 500) {
      newErrors.description = "Mô tả không được vượt quá 500 ký tự";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        toast.error("Lỗi: Không thể tải danh sách loại phụ tùng", {
          position: "top-right",
          autoClose: 4000,
        });
      } finally {
        setLoadingPartTypes(false);
      }
    };

    fetchPartTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Lỗi validation: Vui lòng kiểm tra lại các trường đã nhập", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    try {
      setSaving(true);
      
      let effectiveDateISO = new Date().toISOString();
      if (form.effectiveDate) {
        const dateStr = format(form.effectiveDate, "yyyy-MM-dd");
        const timeStr = form.effectiveTime || "00:00";
        effectiveDateISO = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      }

      const payload = {
        partTypeId: form.partTypeId,
        remedies: form.remedies || "REPAIR",
        name: form.name.trim(),
        laborCost: parseInt(form.laborCost) || 0,
        effectiveDate: effectiveDateISO,
        price: parseInt(form.price) || 0,
        description: form.description?.trim() || ""
      };
      
      if (form.code && form.code.trim()) {
        payload.code = form.code.trim();
      }

      console.log("📤 Creating price service with payload:", payload);

      const response = await createPriceService(payload);
      
      console.log("📥 Create price service response:", response);

      // Handle response - API returns { statusCode, success, message, data }
      if (response?.success || response?.statusCode === 200) {
        toast.success(response?.message || "Tạo bảng giá dịch vụ thành công", {
          position: "top-right",
          autoClose: 4000,
        });
        navigate("/admin/service-packages");
      } else {
        throw new Error(response?.message || "Tạo thất bại");
      }
    } catch (error) {
      console.error("❌ Error creating price service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || "Không thể tạo bảng giá dịch vụ. Vui lòng thử lại.";
      toast.error(`Lỗi: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6 sm:p-8 max-w-5xl mx-auto">
        {/* Header with gradient */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin/service-packages")}
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-6 shadow-lg">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg border border-white/20">
                <Package className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                  Tạo gói dịch vụ mới
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </h1>
                <p className="text-muted-foreground text-sm">
                  Điền thông tin để tạo gói dịch vụ mới cho hệ thống
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border border-border/60 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Thông tin gói dịch vụ</CardTitle>
                <CardDescription className="mt-1">
                  Vui lòng điền đầy đủ thông tin bên dưới. Các trường có dấu <span className="text-red-500 font-semibold">*</span> là bắt buộc.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Loại phụ tùng */}
              <div className={cn(
                "rounded-xl border bg-gradient-to-br from-background to-muted/20 p-5 space-y-3 shadow-sm",
                errors.partTypeId ? "border-red-500/50 bg-red-50/50" : "border-border/60"
              )}>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Loại phụ tùng <span className="text-red-500">*</span></Label>
                </div>
                <Select 
                  value={form.partTypeId} 
                  onValueChange={(value) => {
                    setForm((f) => ({ ...f, partTypeId: value }));
                    validateField("partTypeId", value);
                  }}
                  disabled={loadingPartTypes}
                  required
                >
                  <SelectTrigger className={cn(
                    "h-11 bg-background border transition-colors",
                    errors.partTypeId 
                      ? "border-red-500 focus:border-red-500" 
                      : "border-border/60 hover:border-primary/50 focus:border-primary"
                  )}>
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
                {errors.partTypeId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    {errors.partTypeId}
                  </p>
                )}
              </div>

              {/* Mã và Tên dịch vụ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "rounded-xl border bg-gradient-to-br from-background to-muted/20 p-5 space-y-3 shadow-sm",
                  errors.code ? "border-red-500/50 bg-red-50/50" : "border-border/60"
                )}>
                 
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Tên dịch vụ <span className="text-red-500">*</span></Label>
                  </div>
                  <Input
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      validateField("name", e.target.value);
                    }}
                    placeholder="VD: Sửa chữa cơ bản"
                    required
                    className={cn(
                      "h-11 border transition-colors",
                      errors.name 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-border/60 focus:border-primary"
                    )}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">•</span>
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Mô tả */}
              <div className={cn(
                "rounded-xl border bg-gradient-to-br from-background to-muted/20 p-5 space-y-3 shadow-sm",
                errors.description ? "border-red-500/50 bg-red-50/50" : "border-border/60"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Mô tả</Label>
                  </div>
                  {form.description && (
                    <span className="text-xs text-muted-foreground">
                      {form.description.length}/500
                    </span>
                  )}
                </div>
                <Input
                  value={form.description}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, description: e.target.value }));
                    validateField("description", e.target.value);
                  }}
                  placeholder="Mô tả chi tiết về dịch vụ..."
                  className={cn(
                    "h-11 border transition-colors",
                    errors.description 
                      ? "border-red-500 focus:border-red-500" 
                      : "border-border/60 focus:border-primary"
                  )}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Giá và Chi phí lao động */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "rounded-xl border bg-gradient-to-br p-5 space-y-3 shadow-md",
                  errors.price 
                    ? "border-red-500/50 bg-red-50/50 from-red-50/50 to-red-50/30" 
                    : "border-primary/30 from-primary/5 to-primary/10"
                )}>
                  <div className="flex items-center gap-2">
                    <DollarSign className={cn("h-4 w-4", errors.price ? "text-red-500" : "text-primary")} />
                    <Label className={cn("text-sm font-semibold", errors.price && "text-red-700")}>
                      Giá (VNĐ) <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, price: e.target.value }));
                      validateField("price", e.target.value);
                    }}
                    placeholder="VD: 50000"
                    required
                    min="1"
                    max="1000000000"
                    className={cn(
                      "h-11 border bg-background transition-colors font-semibold",
                      errors.price 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-primary/30 focus:border-primary"
                    )}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">•</span>
                      {errors.price}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "rounded-xl border bg-gradient-to-br from-background to-muted/20 p-5 space-y-3 shadow-sm",
                  errors.laborCost ? "border-red-500/50 bg-red-50/50" : "border-border/60"
                )}>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Chi phí lao động (VNĐ)</Label>
                  </div>
                  <Input
                    type="number"
                    value={form.laborCost}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, laborCost: e.target.value }));
                      validateField("laborCost", e.target.value);
                    }}
                    placeholder="VD: 15000"
                    min="0"
                    max="1000000000"
                    className={cn(
                      "h-11 border transition-colors",
                      errors.laborCost 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-border/60 focus:border-primary"
                    )}
                  />
                  {errors.laborCost && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">•</span>
                      {errors.laborCost}
                    </p>
                  )}
                </div>
              </div>

              {/* Loại dịch vụ và Ngày hiệu lực */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Loại dịch vụ <span className="text-red-500">*</span></Label>
                  </div>
                  <Select value={form.remedies} onValueChange={(v) => setForm((f) => ({ ...f, remedies: v }))}>
                    <SelectTrigger className="h-11 bg-background border border-border/60 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPAIR">Sửa chữa</SelectItem>
                      <SelectItem value="REPLACE">Thay thế</SelectItem>
                      <SelectItem value="CLEAN">Vệ sinh</SelectItem>
                      <SelectItem value="TUNE">Điều chỉnh</SelectItem>
                      <SelectItem value="WARRANTY">Bảo hành</SelectItem>
                      <SelectItem value="NONE">Không có</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Ngày hiệu lực</Label>
                  </div>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-11 border border-border/60 hover:border-primary/50 transition-colors",
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
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-border/60">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/admin/service-packages")}
                  disabled={saving}
                  className="h-11 px-6 border hover:bg-muted/50 transition-colors"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  className="h-11 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="mr-2">Đang tạo...</span>
                      <div className="h-4 w-4 border border-white/30 border-t-white rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Tạo gói dịch vụ
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

