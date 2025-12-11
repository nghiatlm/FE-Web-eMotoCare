import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Wrench, Info, Hash, FileText, Plus, Loader2, Calendar as CalendarIcon, DollarSign, Tag, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getPartTypeById } from "@/api/partsApi";
import { getPriceServices, createPriceService, updatePriceService, getPriceServiceById } from "@/api/priceServicesApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function PartTypeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [partType, setPartType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servicePackages, setServicePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPriceService, setEditingPriceService] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    partTypeId: "",
    remedies: "REPAIR",
    name: "",
    laborCost: "",
    effectiveDate: null,
    effectiveTime: "",
    price: "",
    description: "",
  });
  const [editErrors, setEditErrors] = useState({});

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
        toast.error("Lỗi: Không thể tải thông tin loại phụ tùng", {
          position: "top-right",
          autoClose: 4000,
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
      toast.error("Lỗi: Không thể tải danh sách gói dịch vụ", {
        position: "top-right",
        autoClose: 4000,
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
      "CLEAN": "Vệ sinh",
      "TUNE": "Điều chỉnh",
      "WARRANTY": "Bảo hành",
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

      const response = await createPriceService(payload);

      if (response?.success || response?.statusCode === 200) {
        toast.success(response?.message || "Tạo bảng giá dịch vụ thành công", {
          position: "top-right",
          autoClose: 4000,
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
      toast.error(`Lỗi: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
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

  // Handle open edit dialog
  const handleOpenEditDialog = async (priceService) => {
    try {
      setLoadingEdit(true);
      setIsEditDialogOpen(true);
      setEditingPriceService(priceService);
      
      // Fetch full price service data
      const response = await getPriceServiceById(priceService.id || priceService.rawData?.id);
      const data = response?.data || response || priceService.rawData || priceService;
      
      // Parse effective date and time
      let effectiveDate = null;
      let effectiveTime = "";
      if (data.effectiveDate) {
        const dateObj = new Date(data.effectiveDate);
        effectiveDate = dateObj;
        effectiveTime = dateObj.toTimeString().slice(0, 5); // HH:mm
      }
      
      setEditForm({
        partTypeId: data.partTypeId || id,
        remedies: data.remedies || "REPAIR",
        name: data.name || "",
        laborCost: data.laborCost?.toString() || "",
        effectiveDate: effectiveDate,
        effectiveTime: effectiveTime,
        price: data.price?.toString() || "",
        description: data.description || "",
      });
      setEditErrors({});
    } catch (error) {
      console.error("Error loading price service:", error);
      toast.error("Lỗi: Không thể tải thông tin bảng giá dịch vụ", {
        position: "top-right",
        autoClose: 4000,
      });
      setIsEditDialogOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingPriceService) return;
    
    // Validate
    const newErrors = {};
    if (!editForm.name || !editForm.name.trim()) {
      newErrors.name = "Vui lòng nhập tên dịch vụ";
    }
    if (!editForm.price || !editForm.price.trim()) {
      newErrors.price = "Vui lòng nhập giá dịch vụ";
    } else {
      const priceNum = parseInt(editForm.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = "Giá phải là số hợp lệ và lớn hơn 0";
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    try {
      setLoadingEdit(true);
      
      let effectiveDateISO = new Date().toISOString();
      if (editForm.effectiveDate) {
        const dateStr = format(editForm.effectiveDate, "yyyy-MM-dd");
        const timeStr = editForm.effectiveTime || "00:00";
        effectiveDateISO = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      }

      const payload = {
        partTypeId: editForm.partTypeId,
        remedies: editForm.remedies || "REPAIR",
        name: editForm.name.trim(),
        laborCost: parseInt(editForm.laborCost) || 0,
        effectiveDate: effectiveDateISO,
        price: parseInt(editForm.price) || 0,
        description: editForm.description?.trim() || ""
      };

      const priceServiceId = editingPriceService.id || editingPriceService.rawData?.id;
      const response = await updatePriceService(priceServiceId, payload);

      if (response?.success || response?.statusCode === 200) {
        toast.success(response?.message || "Cập nhật bảng giá dịch vụ thành công", {
          position: "top-right",
          autoClose: 4000,
        });
        
        setIsEditDialogOpen(false);
        setEditingPriceService(null);
        
        // Refresh service packages list
        await fetchServicePackages();
      } else {
        throw new Error(response?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Error updating price service:", error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || "Không thể cập nhật bảng giá dịch vụ. Vui lòng thử lại.";
      toast.error(`Lỗi: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/service-packages")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          <div className="flex items-center gap-2 mt-2">
            <Package className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-semibold text-slate-900">Chi tiết loại phụ tùng</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Xem chi tiết loại phụ tùng và các gói dịch vụ liên quan</p>
          <div className="mt-3 h-[2px] w-24 rounded-full bg-red-500/70" />
        </div>

        {/* Part Type Information */}
        <Card className="mb-6 rounded-xl border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Info className="h-4 w-4" />
              </span>
              <span>Thông tin loại phụ tùng</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <Package className="h-4 w-4" />
                  <span>Tên loại phụ tùng</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
                  {partType.name || "—"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <FileText className="h-4 w-4" />
                  <span>Mô tả</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 leading-relaxed min-h-[44px] flex items-center">
                  {partType.description
                    ? partType.description
                    : <span className="italic text-slate-400">Không có mô tả</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Service Package Form */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle 
                className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => {
                  if (!showForm) {
                    setShowForm(true);
                    // Scroll to form sau khi mở
                    setTimeout(() => {
                      document.querySelector('[data-form-card]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                  }
                }}
              >
                <Plus className="h-5 w-5 text-primary" />
                Tạo gói dịch vụ mới
              </CardTitle>
              {showForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowForm(false);
                  }}
                  className="gap-2"
                >
                  <ChevronUp className="h-4 w-4" />
                  Thu gọn
                </Button>
              )}
            </div>
          </CardHeader>
          {showForm && (
            <CardContent data-form-card>
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
                  <div className="space-y-2">
                  <Label>Mô tả <span className="text-red-500">*</span></Label>
                  <Input
                      value={form.description}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, description: e.target.value }));
                        validateField("description", e.target.value);
                      }}
                      placeholder="Mô tả chi tiết về dịch vụ..."
                      className="h-10"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>  
                </div>

                {/* Giá và Chi phí lao động */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giá <span className="text-red-500">*</span></Label>
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
                    <Label>Chi phí lao động</Label>
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
                        <SelectItem value="CLEAN">Vệ sinh</SelectItem>
                        <SelectItem value="TUNE">Điều chỉnh</SelectItem>
                        <SelectItem value="WARRANTY">Bảo hành</SelectItem>
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
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Wrench className="h-4 w-4" />
              </span>
              <span>Danh sách gói dịch vụ</span>
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
                    <TableRow className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-100/60 border-b border-red-100">
                      <TableHead className="w-16 text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
                        STT
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold tracking-wide text-red-700 uppercase">
                        Tên gói dịch vụ
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
                        Loại dịch vụ
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
                        Giá (VNĐ)
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold tracking-wide text-red-700 uppercase">
                        Chi phí lao động (VNĐ)
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold tracking-wide text-red-700 uppercase">
                        Ngày hiệu lực
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold tracking-wide text-red-700 uppercase">
                        Mô tả
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold tracking-wide text-red-700 uppercase w-20">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicePackages.map((pkg, index) => (
                      <TableRow
                        key={pkg.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                        }`}
                      >
                        <TableCell className="text-center text-sm text-slate-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {pkg.name || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-medium">
                            {getRemediesLabel(pkg.remedies)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {formatPrice(pkg.price)}₫
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-800">
                          {pkg.laborCost ? `${formatPrice(pkg.laborCost)}₫` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-800">
                          {formatDate(pkg.effectiveDate)}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-slate-700">
                          {pkg.description || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(pkg)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa bảng giá dịch vụ</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin bảng giá dịch vụ
              </DialogDescription>
            </DialogHeader>
            
            {loadingEdit ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Tên dịch vụ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm({ ...editForm, name: e.target.value });
                      if (editErrors.name) {
                        setEditErrors({ ...editErrors, name: null });
                      }
                    }}
                    placeholder="Nhập tên dịch vụ"
                    className={editErrors.name ? "border-red-500" : ""}
                  />
                  {editErrors.name && (
                    <p className="text-sm text-red-500">{editErrors.name}</p>
                  )}
                </div>

                {/* Remedies */}
                <div className="space-y-2">
                  <Label htmlFor="edit-remedies">Loại dịch vụ</Label>
                  <Select
                    value={editForm.remedies}
                    onValueChange={(value) => setEditForm({ ...editForm, remedies: value })}
                  >
                    <SelectTrigger id="edit-remedies">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPAIR">Sửa chữa</SelectItem>
                      <SelectItem value="REPLACE">Thay thế</SelectItem>
                      <SelectItem value="CHECK">Kiểm tra</SelectItem>
                      <SelectItem value="NONE">Không có</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="edit-price">
                    Giá (VNĐ) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => {
                      setEditForm({ ...editForm, price: e.target.value });
                      if (editErrors.price) {
                        setEditErrors({ ...editErrors, price: null });
                      }
                    }}
                    placeholder="Nhập giá"
                    min="0"
                    className={editErrors.price ? "border-red-500" : ""}
                  />
                  {editErrors.price && (
                    <p className="text-sm text-red-500">{editErrors.price}</p>
                  )}
                </div>

                {/* Labor Cost */}
                <div className="space-y-2">
                  <Label htmlFor="edit-laborCost">Chi phí lao động (VNĐ)</Label>
                  <Input
                    id="edit-laborCost"
                    type="number"
                    value={editForm.laborCost}
                    onChange={(e) => setEditForm({ ...editForm, laborCost: e.target.value })}
                    placeholder="Nhập chi phí lao động"
                    min="0"
                  />
                </div>

                {/* Effective Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngày hiệu lực</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editForm.effectiveDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.effectiveDate ? (
                            format(editForm.effectiveDate, "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editForm.effectiveDate}
                          onSelect={(date) => setEditForm({ ...editForm, effectiveDate: date })}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-time">Giờ</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={editForm.effectiveTime}
                      onChange={(e) => setEditForm({ ...editForm, effectiveTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Mô tả</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Nhập mô tả"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={loadingEdit}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={loadingEdit}>
                    {loadingEdit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang cập nhật...
                      </>
                    ) : (
                      "Cập nhật"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

