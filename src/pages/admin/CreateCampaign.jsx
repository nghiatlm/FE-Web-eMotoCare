import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Calendar as CalendarIcon, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createCampaign } from "@/api/campaignsApi";
import { useToast } from "@/hooks/use-toast";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "CAMPAIGN",
    startDate: null,
    endDate: null,
    modelName: "",
  });

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Vui lòng nhập tên campaign";
    } else if (form.name.trim().length < 3) {
      newErrors.name = "Tên campaign phải có ít nhất 3 ký tự";
    }
    
    if (!form.description || form.description.trim() === "") {
      newErrors.description = "Vui lòng nhập mô tả campaign";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Mô tả phải có ít nhất 10 ký tự";
    }
    
    if (!form.startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    }
    
    if (!form.endDate) {
      newErrors.endDate = "Vui lòng chọn ngày kết thúc";
    } else if (form.startDate && form.endDate < form.startDate) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    
    if (!form.modelName || form.modelName.trim() === "") {
      newErrors.modelName = "Vui lòng nhập tên model";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
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
      
      // Convert dates to ISO string
      const startDateISO = form.startDate ? new Date(form.startDate).toISOString() : null;
      const endDateISO = form.endDate ? new Date(form.endDate).toISOString() : null;

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        startDate: startDateISO,
        endDate: endDateISO,
        modelName: form.modelName.trim(),
      };
      
      console.log("📤 Creating campaign with payload:", payload);

      const response = await createCampaign(payload);
      
      console.log("📥 Create campaign response:", response);

      // Handle response - API returns { statusCode, success, message, data }
      if (response?.success || response?.statusCode === 200) {
        toast({
          title: "Thành công",
          description: response?.message || "Tạo campaign thành công",
        });
        navigate("/admin/campaigns");
      } else {
        throw new Error(response?.message || "Tạo thất bại");
      }
    } catch (error) {
      console.error("❌ Error creating campaign:", error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.data?.message || "Không thể tạo campaign. Vui lòng thử lại.";
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
      <div className="p-6 sm:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin/campaigns")}
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tạo campaign mới</h1>
              <p className="text-muted-foreground mt-1">Thêm campaign khuyến mãi mới vào hệ thống</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-border/60 shadow-lg bg-card">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/60">
              <CardTitle className="text-xl">Thông tin campaign</CardTitle>
              <CardDescription>Điền đầy đủ thông tin để tạo campaign mới</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Tên campaign */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Tên campaign <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Nhập tên campaign"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Mô tả */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Mô tả <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Nhập mô tả chi tiết về campaign"
                  rows={4}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              {/* Ngày bắt đầu và kết thúc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Ngày bắt đầu <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.startDate && "text-muted-foreground",
                          errors.startDate && "border-destructive"
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
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Ngày kết thúc <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.endDate && "text-muted-foreground",
                          errors.endDate && "border-destructive"
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
                        disabled={(date) => form.startDate && date < form.startDate}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Tên model */}
              <div className="space-y-2">
                <Label htmlFor="modelName" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Tên model <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modelName"
                  value={form.modelName}
                  onChange={(e) => handleChange("modelName", e.target.value)}
                  placeholder="Nhập tên model áp dụng"
                  className={errors.modelName ? "border-destructive" : ""}
                />
                {errors.modelName && (
                  <p className="text-sm text-destructive">{errors.modelName}</p>
                )}
              </div>

              {/* Loại campaign (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="type">Loại campaign</Label>
                <Input
                  id="type"
                  value={form.type}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Loại campaign được mặc định là CAMPAIGN</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/campaigns")}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Megaphone className="mr-2 h-4 w-4" />
                      Tạo campaign
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

