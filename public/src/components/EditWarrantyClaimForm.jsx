import { useState, useEffect } from "react";
import { FileText, Smartphone, Hash, MessageSquare, Calendar, User, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function EditWarrantyClaimForm({ open, onOpenChange, claim, onClaimUpdated }) {
  const [formData, setFormData] = useState({
    deviceModel: "",
    serialNumber: "",
    issueDescription: "",
    submittedDate: null,
    ownerName: "",
    status: "Check-in"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  // Update form data when claim prop changes
  useEffect(() => {
    if (claim) {
      setFormData({
        deviceModel: claim.deviceModel || "",
        serialNumber: claim.serialNumber || "",
        issueDescription: claim.issueDescription || "",
        submittedDate: claim.submittedDate ? new Date(claim.submittedDate) : null,
        ownerName: claim.ownerName || "",
        status: claim.status || "Check-in"
      });
      setErrors({});
    }
  }, [claim]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.deviceModel.trim()) {
      newErrors.deviceModel = "Vui lòng chọn mẫu thiết bị";
    }
    
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = "Vui lòng nhập số serial";
    }
    
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = "Vui lòng mô tả vấn đề";
    }
    
    if (!formData.submittedDate) {
      newErrors.submittedDate = "Vui lòng chọn ngày gửi";
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Vui lòng nhập tên chủ sở hữu";
    }
    
    if (!formData.status) {
      newErrors.status = "Vui lòng chọn trạng thái";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedClaim = {
        ...claim,
        ...formData,
        submittedDate: formData.submittedDate ? format(formData.submittedDate, 'yyyy-MM-dd') : ''
      };
      
      onClaimUpdated(updatedClaim);
      onOpenChange(false);
      
      toast({
        title: "Thành công",
        description: "Cập nhật khiếu nại bảo hành thành công!",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Cập nhật thất bại. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const deviceModels = [
    { value: "Battery X1", label: "Battery X1" },
    { value: "E-Moto S1", label: "E-Moto S1" },
    { value: "Battery Z3", label: "Battery Z3" },
    { value: "Motor Y-Pro", label: "Motor Y-Pro" }
  ];

  const statusOptions = [
    { value: "Check-in", label: "Check-in", icon: CheckCircle },
    { value: "In Progress", label: "In Progress", icon: Clock },
    { value: "Complete", label: "Complete", icon: AlertCircle }
  ];

  if (!claim) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sửa khiếu nại bảo hành: {claim.id}
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin và trạng thái khiếu nại.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceModel" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mẫu thiết bị
              </Label>
              <Select 
                value={formData.deviceModel} 
                onValueChange={(value) => handleInputChange("deviceModel", value)}
              >
                <SelectTrigger className={errors.deviceModel ? "border-destructive" : ""}>
                  <SelectValue placeholder="Chọn mẫu thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  {deviceModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deviceModel && (
                <p className="text-sm text-destructive">{errors.deviceModel}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Số serial
              </Label>
              <Input
                id="serialNumber"
                placeholder="Nhập số serial"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                className={errors.serialNumber ? "border-destructive" : ""}
              />
              {errors.serialNumber && (
                <p className="text-sm text-destructive">{errors.serialNumber}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="issueDescription" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mô tả vấn đề
            </Label>
            <Textarea
              id="issueDescription"
              placeholder="Mô tả chi tiết vấn đề..."
              value={formData.issueDescription}
              onChange={(e) => handleInputChange("issueDescription", e.target.value)}
              className={errors.issueDescription ? "border-destructive" : ""}
              rows={3}
            />
            {errors.issueDescription && (
              <p className="text-sm text-destructive">{errors.issueDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submittedDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ngày gửi
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${!formData.submittedDate ? "text-muted-foreground" : ""} ${errors.submittedDate ? "border-destructive" : ""}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.submittedDate ? format(formData.submittedDate, "PPP") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.submittedDate}
                    onSelect={(date) => handleInputChange("submittedDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.submittedDate && (
                <p className="text-sm text-destructive">{errors.submittedDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Tên chủ sở hữu
              </Label>
              <Input
                id="ownerName"
                placeholder="Nhập tên chủ sở hữu"
                value={formData.ownerName}
                onChange={(e) => handleInputChange("ownerName", e.target.value)}
                className={errors.ownerName ? "border-destructive" : ""}
              />
              {errors.ownerName && (
                <p className="text-sm text-destructive">{errors.ownerName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Trạng thái
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
