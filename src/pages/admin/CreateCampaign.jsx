import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Upload, Image as ImageIcon, ChevronDown } from "lucide-react";
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
import { getParts, getModelParts } from "@/api/partsApi";
import { SERVICE_TYPE_MAP } from "@/utils/constants";
import { toast } from "react-toastify";
import { authService } from "@/services/authService";
import { uploadFile } from "@/utils/firebaseUpload";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [models, setModels] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [programItems, setProgramItems] = useState([
    { modelId: "", partIds: [], parts: [], partDetails: {}, loading: false, error: "", partPopoverOpen: false, partSearch: "", detailsCollapsed: false },
  ]);

  const partTriggerRefs = useRef([]);
  const partPopoverRefs = useRef([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      setProgramItems((prev) =>
        prev.map((p, idx) => {
          const triggerEl = partTriggerRefs.current[idx];
          const popoverEl = partPopoverRefs.current[idx];
          if (!p.partPopoverOpen) return p;
          const target = event.target;
          const insideTrigger = triggerEl && triggerEl.contains(target);
          const insidePopover = popoverEl && popoverEl.contains(target);
          if (insideTrigger || insidePopover) return p;
          return { ...p, partPopoverOpen: false };
        })
      );
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [partTriggerRefs, partPopoverRefs]);

  const [form, setForm] = useState({
    type: "RECALL",
    title: "",
    description: "",
    startDate: null,
    endDate: null,
    attachmentUrl: "",
    discountPercent: 0,
    bonusAmount: 0,
    recallAction: "",
  });

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
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Lỗi: Kích thước file không được vượt quá 5MB", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setSelectedImage(file);
    setAttachmentName(file.name || "");
    
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

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview("");
    setAttachmentName("");
    handleChange("attachmentUrl", "");
  };

  const compareDatesOnly = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() - d2.getTime();
  };

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
    
    if (!form.startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    } else {
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
      const diff = compareDatesOnly(form.endDate, form.startDate);
      if (diff < 0) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    programItems.forEach((item, idx) => {
      if (!item.modelId) newErrors[`program_model_${idx}`] = "Vui lòng chọn model";
      if (form.type === "RECALL" && (!item.partIds || item.partIds.length === 0)) {
        newErrors[`program_part_${idx}`] = "Vui lòng chọn ít nhất 1 phụ tùng cho model này";
      }
    });
    
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
      
      const user = authService.getCurrentUser();
      const userId = user?.accountResponse?.id || user?.id;
      
      if (!userId) {
        toast.error("Lỗi: Không tìm thấy thông tin người dùng", {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }
      
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

      const getServiceTypeFromProgramType = (programType) => {
        if (programType === "RECALL") return "RECALL_TYPE";
        return "CAMPAIGN_TYPE";
      };

      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: startDateISO,
        endDate: endDateISO,
        attachmentUrl: attachmentUrl || undefined,
        createdBy: userId,
        updatedBy: userId,
        vehicleModels: Array.from(
          new Set(programItems.map((item) => item.modelId).filter(Boolean))
        ).map((id) => ({ vehicleModelId: id })),
        programDetails: programItems.reduce((arr, item) => {
          (item.partIds || []).forEach((pid) => {
            const detail = item.partDetails?.[pid] || {};
            arr.push({
              recallPartId: pid,
              serviceType: getServiceTypeFromProgramType(form.type),
              discountPercent: Number(detail.discountPercent) || 0,
              bonusAmount: 0,
              recallAction: detail.recallAction || form.recallAction || (form.type === "RECALL" ? "Thu hồi" : ""),
            });
          });
          return arr;
        }, []),
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/70 to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full px-3 sm:px-6 lg:px-10 max-w-[1600px] mx-auto pb-10">
        <div className="mb-6 pt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin/campaigns")}
            className="mb-3 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors"
          >
            Quay lại
          </Button>
          
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-rose-100 shadow-sm backdrop-blur-sm shadow-rose-100/60">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Tạo chiến dịch mới
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Tạo chiến dịch mới cho hệ thống
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border border-rose-100/80 dark:border-slate-800 shadow-sm bg-white/95 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-4 border-b border-rose-100/70 dark:border-slate-800 bg-gradient-to-r from-rose-50 via-pink-50/60 to-transparent">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Thông tin chiến dịch
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1.5">
                Các trường có dấu <span className="text-red-500 font-medium">*</span> là bắt buộc
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-1.5 text-sm font-medium">
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
                    <SelectItem value="RECALL">Thu hồi</SelectItem>
                    <SelectItem value="CAMPAIGN">Chiến dịch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1.5 text-sm font-medium">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="flex items-center gap-1.5 text-sm font-medium">
                    Mô tả
                </Label>
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
              <div className="pt-2 border-t border-dashed border-rose-100 mt-2" />
              <div className="flex items-center justify-between mb-1 mt-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">Thời gian áp dụng</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-1.5 text-sm font-medium">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2 md:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">Model & phụ tùng</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProgramItems((prev) => [
                          ...prev,
                          { modelId: "", partIds: [], parts: [], partDetails: {}, loading: false, error: "", partPopoverOpen: false, partSearch: "", detailsCollapsed: false },
                        ])
                      }
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    >
                      Thêm model/phụ tùng
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {programItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500">Cặp #{idx + 1}</div>
                          {programItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProgramItems((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-red-500 hover:text-red-600"
                            >
                              Xóa
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setProgramItems((prev) =>
                                prev.map((p, i) =>
                                  i === idx ? { ...p, detailsCollapsed: !p.detailsCollapsed } : p
                                )
                              )
                            }
                            className="text-primary hover:text-primary"
                          >
                            {item.detailsCollapsed ? "Mở chi tiết" : "Thu gọn"}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Model</Label>
                            <Select
                              value={item.modelId}
                              onValueChange={async (val) => {
                                setProgramItems((prev) =>
                                  prev.map((p, i) =>
                                    i === idx ? { ...p, modelId: val, partIds: [], parts: [], partDetails: {}, loading: true, partPopoverOpen: false, partSearch: "" } : p
                                  )
                                );
                                try {
                                  const res = await getModelParts({ modelId: val, page: 1, pageSize: 100 });
                                  const list = res?.data?.rowDatas || res?.data || [];
                                  setProgramItems((prev) =>
                                    prev.map((p, i) =>
                                      i === idx ? { ...p, parts: list, loading: false } : p
                                    )
                                  );
                                } catch (err) {
                                  setProgramItems((prev) =>
                                    prev.map((p, i) =>
                                      i === idx ? { ...p, loading: false, error: "Không tải được phụ tùng" } : p
                                    )
                                  );
                                  toast.error("Lỗi: Không tải được phụ tùng theo model");
                                }
                              }}
                              disabled={loadingModels}
                            >
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder={loadingModels ? "Đang tải..." : "Chọn model"} />
                              </SelectTrigger>
                              <SelectContent>
                                {(models || [])
                                  .filter((model) => {
                                    const selected = programItems
                                      .map((p, i) => (i === idx ? null : p.modelId))
                                      .filter(Boolean);
                                    return model.id === item.modelId || !selected.includes(model.id);
                                  })
                                  .map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      {model.name || model.code || model.id}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {errors[`program_model_${idx}`] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <span>•</span>
                                {errors[`program_model_${idx}`]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Phụ tùng (nhiều)</Label>
                            <div className="relative">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full h-10 justify-between text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-primary/40 focus:border-primary focus:ring-primary/20 rounded-md px-3"
                                onClick={() =>
                                  setProgramItems((prev) =>
                                    prev.map((p, i) =>
                                      i === idx ? { ...p, partPopoverOpen: !p.partPopoverOpen } : p
                                    )
                                  )
                                }
                                disabled={item.loading}
                                ref={(el) => {
                                  partTriggerRefs.current[idx] = el;
                                }}
                              >
                                <span className="truncate text-left">
                                  {item.partIds?.length
                                    ? `${item.partIds.length} phụ tùng đã chọn`
                                    : item.loading
                                    ? "Đang tải..."
                                    : "Chọn phụ tùng"}
                                </span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
                              </Button>
                              {item.partPopoverOpen && (
                                <div
                                  className="absolute z-20 mt-2 w-full max-h-80 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
                                  ref={(el) => {
                                    partPopoverRefs.current[idx] = el;
                                  }}
                                >
                                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70">
                                    <Input
                                      autoFocus
                                      value={item.partSearch || ""}
                                      onChange={(e) =>
                                        setProgramItems((prev) =>
                                          prev.map((p, i) =>
                                            i === idx ? { ...p, partSearch: e.target.value } : p
                                          )
                                        )
                                      }
                                      placeholder="Tìm phụ tùng..."
                                      className="h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-0 focus-visible:border-primary/40 focus:border-primary/40"
                                    />
                                  </div>
                                  <div className="max-h-64 overflow-auto p-2 space-y-1">
                                    {item.loading ? (
                                      <p className="text-xs text-muted-foreground px-2 py-1">Đang tải...</p>
                                    ) : (item.parts || []).length === 0 ? (
                                      <p className="text-xs text-muted-foreground px-2 py-1">Chưa có phụ tùng</p>
                                    ) : (
                                      ((item.parts || []).filter((part) => {
                                        const pid = part.partId || part.id;
                                        const label = (part.partName || part.name || pid || "").toLowerCase();
                                        const keyword = (item.partSearch || "").toLowerCase().trim();
                                        return !keyword || label.includes(keyword);
                                      }) || []).map((part) => {
                                        const pid = part.partId || part.id;
                                        const isSelected = item.partIds?.includes(pid);
                                        return (
                                          <button
                                            type="button"
                                            key={pid}
                                            className={cn(
                                              "w-full flex items-center gap-2 text-sm rounded-md px-2 py-2 text-left transition-colors",
                                              isSelected
                                                ? "bg-primary/5 text-primary font-semibold"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                            )}
                                            onClick={() =>
                                              setProgramItems((prev) =>
                                                prev.map((p, i) =>
                                                  i === idx
                                                    ? {
                                                        ...p,
                                                        partIds: isSelected
                                                          ? p.partIds.filter((x) => x !== pid)
                                                          : [...(p.partIds || []), pid],
                                                        partDetails: (() => {
                                                          const details = { ...(p.partDetails || {}) };
                                                          if (isSelected) {
                                                            delete details[pid];
                                                          } else {
                                                            details[pid] = {
                                                              discountPercent: 0,
                                                              recallAction: "",
                                                            };
                                                          }
                                                          return details;
                                                        })(),
                                                      }
                                                    : p
                                                )
                                              )
                                            }
                                          >
                                            <span
                                              className={cn(
                                                "inline-flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                                                isSelected
                                                  ? "border-primary bg-primary text-white"
                                                  : "border-slate-300 bg-white text-transparent"
                                              )}
                                            >
                                              ✓
                                            </span>
                                            <span className="truncate">{part.partName || part.name || pid}</span>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {errors[`program_part_${idx}`] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <span>•</span>
                                {errors[`program_part_${idx}`]}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.partIds && item.partIds.length > 0 && !item.detailsCollapsed && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Thông tin phụ tùng đã chọn</p>
                            <div className="space-y-2">
                              {item.partIds.map((pid) => {
                                const partObj = item.parts?.find((p) => (p.partId || p.id) === pid);
                                const partLabel = partObj?.partName || partObj?.name || pid;
                                const partThumb =
                                  partObj?.imageUrl ||
                                  partObj?.image ||
                                  partObj?.thumbnail ||
                                  partObj?.photoUrl ||
                                  partObj?.imagePath ||
                                  "";
                                const detail = item.partDetails?.[pid] || {};
                                return (
                                  <div
                                    key={pid}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 px-3 py-3 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded border border-slate-200 bg-slate-50 overflow-hidden flex-shrink-0">
                                          {partThumb ? (
                                            <img src={partThumb} alt={partLabel} className="h-full w-full object-cover" />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 bg-slate-100">
                                              PT
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                          {partLabel}
                                        </span>
                                      </div>
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                                          form.type === "RECALL"
                                            ? "bg-rose-50 border-rose-200 text-rose-700"
                                            : "bg-blue-50 border-blue-200 text-blue-700"
                                        )}
                                      >
                                        {form.type === "RECALL" ? "Thu hồi" : "Chiến dịch"}
                                      </span>
                                    </div>
                                    {form.type === "CAMPAIGN" && (
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Giảm giá (%)</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={detail.discountPercent ?? 0}
                                          onChange={(e) =>
                                            setProgramItems((prev) =>
                                              prev.map((p, i) =>
                                                i === idx
                                                  ? {
                                                      ...p,
                                                      partDetails: {
                                                        ...(p.partDetails || {}),
                                                        [pid]: {
                                                          ...(p.partDetails?.[pid] || {}),
                                                          discountPercent: Number(e.target.value) || 0,
                                                        },
                                                      },
                                                    }
                                                  : p
                                              )
                                            )
                                          }
                                          placeholder="0"
                                          className="h-9 text-sm"
                                        />
                                      </div>
                                    )}
                                    {form.type === "RECALL" && (
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-600">Hành động thu hồi</Label>
                                        <Input
                                          value={detail.recallAction || ""}
                                          onChange={(e) =>
                                            setProgramItems((prev) =>
                                              prev.map((p, i) =>
                                                i === idx
                                                  ? {
                                                      ...p,
                                                      partDetails: {
                                                        ...(p.partDetails || {}),
                                                        [pid]: {
                                                          ...(p.partDetails?.[pid] || {}),
                                                          recallAction: e.target.value,
                                                        },
                                                      },
                                                    }
                                                  : p
                                              )
                                            )
                                          }
                                          placeholder="Nhập hành động cho phụ tùng này"
                                          className="h-9 text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              
              </div>
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
                    <>Tạo chiến dịch</>
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
