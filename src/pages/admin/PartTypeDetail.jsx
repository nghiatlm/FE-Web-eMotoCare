import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Wrench, Info, Hash, FileText, Plus, Loader2, Calendar as CalendarIcon, DollarSign, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPartTypeById } from "@/api/partsApi";
import { getPriceServices, createPriceService } from "@/api/priceServicesApi";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function PartTypeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [partType, setPartType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servicePackages, setServicePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state - partTypeId tự động từ URL params
  const [form, setForm] = useState({
    partTypeId: id || "",
    code: "",
    remedies: "REPAIR",
    name: "",
    laborCost: "",
    effectiveDate: null,
    effectiveTime: "",
    price: "",
    description: "",
  });

  // Fetch Part Type detail
  useEffect(() => {
    const fetchPartType = async () => {
      try {
        setLoading(true);
        const response = await getPartTypeById(id);
        
        if (response.success && response.data) {
          setPartType(response.data);
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy loại phụ tùng",
            variant: "destructive"
          });
          navigate("/admin/service-packages");
        }
      } catch (error) {
        console.error("Error fetching part type:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin loại phụ tùng",
          variant: "destructive"
        });
        navigate("/admin/service-packages");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPartType();
    }
  }, [id, navigate, toast]);

  // Update form.partTypeId when id changes
  useEffect(() => {
    if (id) {
      setForm(prev => ({ ...prev, partTypeId: id }));
    }
  }, [id]);

  // Fetch service packages for this part type
  const fetchServicePackages = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoadingPackages(true);
      const response = await getPriceServices(1, 100);
      
      const packages = response?.data?.rowDatas || response?.rowDatas || [];
      
      // Filter packages by partTypeId
      const filtered = packages.filter(pkg => pkg.partTypeId === id);
      setServicePackages(filtered);
    } catch (error) {
      console.error("Error fetching service packages:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách gói dịch vụ",
        variant: "destructive"
      });
      setServicePackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchServicePackages();
  }, [fetchServicePackages]);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price || 0);
  };

  // Get remedies label
  const getRemediesLabel = (remedies) => {
    const map = {
      "REPAIR": "Sửa chữa",
      "REPLACE": "Thay thế",
      "CHECK": "Kiểm tra",
      "NONE": "Không có"
    };
    return map[remedies] || remedies;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng kiểm tra lại các trường đã nhập",
        variant: "destructive"
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

      const response = await createPriceService(payload);

      if (response?.success || response?.statusCode === 200) {
        toast({
          title: "Thành công",
          description: response?.message || "Tạo bảng giá dịch vụ thành công",
        });
        
        // Reset form
        setForm({
          partTypeId: id,
          code: "",
          remedies: "REPAIR",
          name: "",
          laborCost: "",
          effectiveDate: null,
          effectiveTime: "",
          price: "",
          description: "",
        });
        setErrors({});
        setShowForm(false);
        
        // Refresh service packages list
        await fetchServicePackages();
      } else {
        throw new Error(response?.message || "Tạo thất bại");
      }
    } catch (error) {
      console.error("Error creating price service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || "Không thể tạo bảng giá dịch vụ. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      partTypeId: id,
      code: "",
      remedies: "REPAIR",
      name: "",
      laborCost: "",
      effectiveDate: null,
      effectiveTime: "",
      price: "",
      description: "",
    });
    setErrors({});
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!partType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/service-packages")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Chi tiết loại phụ tùng</h1>
          </div>
        </div>

        {/* Part Type Information */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Thông tin loại phụ tùng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>Mã loại phụ tùng</span>
                </div>
                <p className="text-base font-mono font-semibold text-foreground">
                  {partType.id || "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Tên loại phụ tùng</span>
                </div>
                <p className="text-base font-semibold text-foreground">
                  {partType.name || "—"}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Mô tả</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                {partType.description || "Không có mô tả"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create Service Package Form */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Tạo gói dịch vụ mới
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(!showForm)}
                className="gap-2"
              >
                {showForm ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mở rộng
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Loại phụ tùng - Disabled vì tự động */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Loại phụ tùng</Label>
                  </div>
                  <Input
                    value={partType.name}
                    disabled
                    className="h-10 bg-muted/50"
                  />
                </div>

                {/* Mã và Tên dịch vụ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mã (tùy chọn)</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, code: e.target.value }));
                        validateField("code", e.target.value);
                      }}
                      placeholder="VD: PriceSV-00001"
                      className="h-10"
                      maxLength={50}
                    />
                    {errors.code && (
                      <p className="text-sm text-red-500">{errors.code}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tên dịch vụ <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }));
                        validateField("name", e.target.value);
                      }}
                      placeholder="VD: Sửa chữa cơ bản"
                      required
                      className="h-10"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mô tả</Label>
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
                    className="h-10"
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Giá và Chi phí lao động */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giá (VNĐ) <span className="text-red-500">*</span></Label>
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
                      className="h-10"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Chi phí lao động (VNĐ)</Label>
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
                      className="h-10"
                    />
                    {errors.laborCost && (
                      <p className="text-sm text-red-500">{errors.laborCost}</p>
                    )}
                  </div>
                </div>

                {/* Loại dịch vụ và Ngày hiệu lực */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại dịch vụ <span className="text-red-500">*</span></Label>
                    <Select value={form.remedies} onValueChange={(v) => setForm((f) => ({ ...f, remedies: v }))}>
                      <SelectTrigger className="h-10">
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
                    <Label>Ngày hiệu lực</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
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

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Tạo gói dịch vụ
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* Service Packages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Danh sách gói dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : servicePackages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Chưa có gói dịch vụ nào cho loại phụ tùng này
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tạo gói dịch vụ đầu tiên
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên gói dịch vụ</TableHead>
                      <TableHead>Loại dịch vụ</TableHead>
                      <TableHead>Giá (VNĐ)</TableHead>
                      <TableHead>Chi phí lao động (VNĐ)</TableHead>
                      <TableHead>Ngày hiệu lực</TableHead>
                      <TableHead>Mô tả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicePackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getRemediesLabel(pkg.remedies)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(pkg.price)}₫
                        </TableCell>
                        <TableCell>
                          {pkg.laborCost ? formatPrice(pkg.laborCost) + "₫" : "—"}
                        </TableCell>
                        <TableCell>{formatDate(pkg.effectiveDate)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {pkg.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

