import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Calendar as CalendarIcon, FileText, Tag, Car, Package, DollarSign, Percent, Plus, X, Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createCampaign } from "@/api/campaignsApi";
import { getModels } from "@/api/modelsApi";
import { getParts } from "@/api/partsApi";
import { SERVICE_TYPE_MAP } from "@/utils/constants";
import { toast } from "react-toastify";
import { authService } from "@/services/authService";
import { uploadFile } from "@/utils/firebaseUpload";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Loading states
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Data states
  const [models, setModels] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const [form, setForm] = useState({
    type: "RECALL", // Theo API documentation
    title: "",
    description: "",
    startDate: null,
    endDate: null,
    attachmentUrl: "",
    vehicleModelId: "",
    recallPartId: "",
    discountPercent: 0,
    bonusAmount: 0,
    recallAction: "",
  });

  // Load models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        const response = await getModels({ page: 1, pageSize: 100, status: "ACTIVE" });
        const modelsData = response?.data?.rowDatas || response?.data || [];
        setModels(modelsData);
      } catch (error) {
        console.error("Error fetching models:", error);
        toast.error("Lỗi: Không thể tải danh sách models", {
          position: "top-right",
          autoClose: 4000,
        });
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Load parts on mount
  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoadingParts(true);
        const response = await getParts({ page: 1, pageSize: 100, status: "ACTIVE" });
        const partsData = response?.data?.rowDatas || response?.data || [];
        setParts(partsData);
      } catch (error) {
        console.error("Error fetching parts:", error);
        toast.error("Lỗi: Không thể tải danh sách parts", {
          position: "top-right",
          autoClose: 4000,
        });
      } finally {
        setLoadingParts(false);
      }
    };

    fetchParts();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle file selection (image or other attachment)
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Lỗi: Kích thước file không được vượt quá 5MB", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setSelectedImage(file);
    setAttachmentName(file.name || "");
    
    // Create preview if file is image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  // Handle image remove
  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview("");
    setAttachmentName("");
    handleChange("attachmentUrl", "");
  };

  // Helper function to compare dates without time component
  const compareDatesOnly = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() - d2.getTime();
  };

  // Helper function to get today's date without time
  const getTodayDateOnly = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title || form.title.trim() === "") {
      newErrors.title = "Vui lòng nhập tiêu đề campaign";
    } else if (form.title.trim().length < 3) {
      newErrors.title = "Tiêu đề phải có ít nhất 3 ký tự";
    }
    
    if (!form.description || form.description.trim() === "") {
      newErrors.description = "Vui lòng nhập mô tả campaign";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Mô tả phải có ít nhất 10 ký tự";
    }
    
    if (!form.startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    } else {
      // Validate startDate must be today or future (compare dates only, no time)
      const today = getTodayDateOnly();
      const startDateOnly = new Date(form.startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      
      if (startDateOnly < today) {
        newErrors.startDate = "Ngày bắt đầu phải là hôm nay hoặc ngày trong tương lai";
      }
    }
    
    if (!form.endDate) {
      newErrors.endDate = "Vui lòng chọn ngày kết thúc";
    } else if (form.startDate) {
      // Compare dates without time component
      const diff = compareDatesOnly(form.endDate, form.startDate);
      if (diff < 0) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }
    
    if (!form.vehicleModelId) {
      newErrors.vehicleModelId = "Vui lòng chọn model xe";
    }
    
    if (!form.recallPartId) {
      newErrors.recallPartId = "Vui lòng chọn phụ tùng";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      
      // Get current user
      const user = authService.getCurrentUser();
      const userId = user?.accountResponse?.id || user?.id;
      
      if (!userId) {
        toast.error("Lỗi: Không tìm thấy thông tin người dùng", {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }
      
      // Upload file to Firebase if selected
      let attachmentUrl = form.attachmentUrl;
      if (selectedImage) {
        try {
          setUploadingImage(true);
          const timestamp = Date.now();
          const fileName = `campaigns/${timestamp}_${selectedImage.name}`;
          attachmentUrl = await uploadFile(fileName, selectedImage);
          toast.success("Tải file lên thành công", {
            position: "top-right",
            autoClose: 4000,
          });
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Lỗi: Không thể tải file lên. Vui lòng thử lại.", {
            position: "top-right",
            autoClose: 4000,
          });
          return;
        } finally {
          setUploadingImage(false);
        }
      }
      
      const formatDateToISO = (date) => {
        if (!date) return null;
        const dateObj = date instanceof Date ? date : new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const day = dateObj.getDate();
        return new Date(Date.UTC(year, month, day, 12, 0, 0, 0)).toISOString();
      };
      
      const startDateISO = formatDateToISO(form.startDate);
      const endDateISO = formatDateToISO(form.endDate);

      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: startDateISO,
        endDate: endDateISO,
        attachmentUrl: attachmentUrl || undefined,
        createdBy: userId,
        updatedBy: userId,
        vehicleModels: [
          {
            vehicleModelId: form.vehicleModelId
          }
        ],
        programDetails: [
          {
            recallPartId: form.recallPartId,
            serviceType: "CAMPAIGN_TYPE",
            discountPercent: form.discountPercent || 0,
            bonusAmount: form.bonusAmount || 0,
            recallAction: form.recallAction || ""
          }
        ]
      };
      
      const response = await createCampaign(payload);
            if (response?.success || response?.statusCode === 200) {
        toast.success(response?.message || "Tạo chiến dịch thành công", {
          position: "top-right",
          autoClose: 4000,
        });
        navigate("/admin/campaigns");
      } else {
        throw new Error(response?.message || "Tạo chiến dịch thất bại");
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || "Không thể tạo chiến dịch. Vui lòng thử lại.";
      toast.error(`Lỗi: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full px-3 sm:px-6 lg:px-10 max-w-[1600px] mx-auto">
        {/* Header - Compact & Friendly */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin/campaigns")}
            className="mb-3 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-primary/10 shadow-sm backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Tạo chiến dịch mới
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Điền thông tin để tạo chiến dịch khuyến mãi mới
              </p>
            </div>
          </div>
        </div>

        {/* Form - Compact & Clean */}
        <form onSubmit={handleSubmit}>
          <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-slate-200/60 dark:border-slate-800 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary/70" />
                <CardTitle className="text-lg font-semibold">Thông tin chiến dịch</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1.5">
                Các trường có dấu <span className="text-red-500 font-medium">*</span> là bắt buộc
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Tiêu đề */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1.5 text-sm font-medium">
                  <Tag className="h-3.5 w-3.5 text-primary/70" />
                  Tiêu đề chiến dịch <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Nhập tiêu đề chiến dịch"
                  className={cn(
                    "h-10 text-sm transition-all",
                    errors.title 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                  )}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>•</span>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Mô tả */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="flex items-center gap-1.5 text-sm font-medium">
                    <FileText className="h-3.5 w-3.5 text-primary/70" />
                    Mô tả <span className="text-red-500">*</span>
                </Label>
                  {form.description && (
                    <span className="text-xs text-muted-foreground">
                      {form.description.length} ký tự
                    </span>
                  )}
                </div>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Nhập mô tả chi tiết về chiến dịch"
                  rows={3}
                  className={cn(
                    "text-sm transition-all resize-none",
                    errors.description 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>•</span>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Ngày bắt đầu và kết thúc */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-1.5 text-sm font-medium">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/70" />
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 text-sm transition-all",
                          !form.startDate && "text-muted-foreground",
                          errors.startDate 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.startDate ? (
                          format(form.startDate, "PPP", { locale: vi })
                        ) : (
                          <span>Chọn ngày bắt đầu</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={form.startDate}
                        onSelect={(date) => handleChange("startDate", date)}
                        initialFocus
                        disabled={(date) => {
                          const today = getTodayDateOnly();
                          const dateOnly = new Date(date);
                          dateOnly.setHours(0, 0, 0, 0);
                          return dateOnly < today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>•</span>
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-1.5 text-sm font-medium">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/70" />
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 text-sm transition-all",
                          !form.endDate && "text-muted-foreground",
                          errors.endDate 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.endDate ? (
                          format(form.endDate, "PPP", { locale: vi })
                        ) : (
                          <span>Chọn ngày kết thúc</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={form.endDate}
                        onSelect={(date) => handleChange("endDate", date)}
                        initialFocus
                        disabled={(date) => {
                          const today = getTodayDateOnly();
                          const dateOnly = new Date(date);
                          dateOnly.setHours(0, 0, 0, 0);
                          // Disable past dates and dates before startDate
                          if (dateOnly < today) return true;
                          if (form.startDate) {
                            const startDateOnly = new Date(form.startDate);
                            startDateOnly.setHours(0, 0, 0, 0);
                            return dateOnly < startDateOnly;
                          }
                          return false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>•</span>
                      {errors.endDate}
                    </p>
                  )}
                </div>

                <div className="hidden md:block" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleModelId" className="flex items-center gap-1.5 text-sm font-medium">
                    <Car className="h-3.5 w-3.5 text-primary/70" />
                    Model xe <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.vehicleModelId}
                    onValueChange={(value) => handleChange("vehicleModelId", value)}
                    disabled={loadingModels}
                  >
                    <SelectTrigger className={cn(
                      "h-10 text-sm transition-all",
                      errors.vehicleModelId 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                    )}>
                      <SelectValue placeholder={loadingModels ? "Đang tải..." : "Chọn model xe"} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name || model.code || model.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleModelId && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>•</span>
                      {errors.vehicleModelId}
                    </p>
                  )}
                </div>

              <div className="space-y-2">
                  <Label htmlFor="recallPartId" className="flex items-center gap-1.5 text-sm font-medium">
                    <Package className="h-3.5 w-3.5 text-primary/70" />
                    Phụ tùng <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.recallPartId}
                    onValueChange={(value) => handleChange("recallPartId", value)}
                    disabled={loadingParts}
                  >
                    <SelectTrigger className={cn(
                      "h-10 text-sm transition-all",
                      errors.recallPartId 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                    )}>
                      <SelectValue placeholder={loadingParts ? "Đang tải..." : "Chọn phụ tùng"} />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name || part.code || part.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.recallPartId && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>•</span>
                      {errors.recallPartId}
                    </p>
                  )}
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="type" className="flex items-center gap-1.5 text-sm font-medium">
                    <Tag className="h-3.5 w-3.5 text-primary/70" />
                    Loại chiến dịch <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger className="h-10 text-sm border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Chọn loại chiến dịch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECALL">Triệu hồi</SelectItem>
                      <SelectItem value="CAMPAIGN">Chiến dịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                    Loại dịch vụ
                  </Label>
                  <Input
                    id="serviceType"
                    value={SERVICE_TYPE_MAP.CAMPAIGN_TYPE || "Chiến dịch"}
                    disabled
                    className="h-10 text-sm bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Discount và Bonus */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercent" className="flex items-center gap-1.5 text-sm font-medium">
                    <Percent className="h-3.5 w-3.5 text-primary/70" />
                    Giảm giá (%)
                  </Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={(e) => handleChange("discountPercent", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-10 text-sm border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonusAmount" className="flex items-center gap-1.5 text-sm font-medium">
                    Số tiền thưởng (VND)
                  </Label>
                  <div className="relative">
                    <Input
                      id="bonusAmount"
                      type="number"
                      min="0"
                      value={form.bonusAmount}
                      onChange={(e) => handleChange("bonusAmount", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="h-10 text-sm pr-14 border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-600 dark:text-emerald-400 pointer-events-none">
                      VND
                    </span>
                  </div>
                </div>

                <div className="hidden md:block" />
              </div>

              {/* Upload tệp đính kèm */}
              <div className="space-y-2">
                <Label htmlFor="attachment" className="flex items-center gap-1.5 text-sm font-medium">
                  <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                  Tệp đính kèm
                </Label>
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-[1.01]"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 shadow-md hover:scale-105 transition-transform"
                        onClick={handleImageRemove}
                        disabled={uploadingImage}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (attachmentName || form.attachmentUrl) ? (
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {attachmentName || form.attachmentUrl?.split("/").pop() || "Tệp đính kèm"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {form.attachmentUrl ? "Đã tải lên" : "Đang chọn tệp"}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                        onClick={handleImageRemove}
                        disabled={uploadingImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer">
                      <input
                        type="file"
                        id="attachment"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="attachment"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground mb-0.5">
                          Click để chọn tệp hoặc kéo thả vào đây
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Hỗ trợ mọi loại tệp, tối đa 5MB
                        </span>
                      </label>
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải ảnh lên...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recallAction" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                  Hành động
                </Label>
                <Textarea
                  id="recallAction"
                  value={form.recallAction}
                  onChange={(e) => handleChange("recallAction", e.target.value)}
                  placeholder="Nhập mô tả hành động"
                  rows={2}
                  className="text-sm border-slate-200 dark:border-slate-700 hover:border-primary/40 focus:border-primary focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/campaigns")}
                  disabled={saving || uploadingImage}
                  className="h-10 px-5 text-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="h-10 px-6 text-sm bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all font-medium"
                >
                  {saving || uploadingImage ? (
                    <>
                      <span className="mr-2">{uploadingImage ? "Đang tải ảnh..." : "Đang tạo..."}</span>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      <Megaphone className="mr-2 h-3.5 w-3.5" />
                      Tạo chiến dịch
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
