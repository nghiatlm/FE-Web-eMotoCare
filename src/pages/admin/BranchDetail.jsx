import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Clock, Users, Hash, Info, Calendar, FileText, Edit, DollarSign, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { getServiceCenterById, createServiceCenterSlot } from "@/api/serviceCentersApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: "",
    slotTime: "",
    capacity: 0,
    isActive: true,
    note: "",
  });

  // Mock summary stats - có thể lấy từ API sau
  const summaryStats = {
    totalRevenue: 903000000,
    totalAppointments: 340,
    completedAppointments: 318,
    totalStaff: 24,
    activeStaff: 20,
    totalWarrantyClaims: 86,
    confirmedWarranty: 101,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fetchBranchDetail = async () => {
    if (id) {
      try {
        setLoading(true);
        const response = await getServiceCenterById(id);
        if (response.success && response.data) {
          setBranchDetail(response.data);
        }
      } catch (error) {
        console.error("Error fetching branch detail:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBranchDetail();
  }, [id]);

  // Slot time options
  const SLOT_TIME_OPTIONS = [
    { value: "H07_08", label: "07:00 - 08:00" },
    { value: "H08_09", label: "08:00 - 09:00" },
    { value: "H09_10", label: "09:00 - 10:00" },
    { value: "H10_11", label: "10:00 - 11:00" },
    { value: "H13_14", label: "13:00 - 14:00" },
    { value: "H14_15", label: "14:00 - 15:00" },
    { value: "H15_16", label: "15:00 - 16:00" },
    { value: "H16_17", label: "16:00 - 17:00" },
    { value: "H17_18", label: "17:00 - 18:00" },
  ];

  // Get day of week from date
  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Handle create slot
  const handleCreateSlot = async () => {
    if (!slotForm.date || !slotForm.slotTime) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin (Ngày và Khung giờ)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingSlot(true);
      const dayOfWeek = getDayOfWeek(slotForm.date);
      
      const slotData = {
        date: slotForm.date,
        dayOfWeek: dayOfWeek,
        slotTime: slotForm.slotTime,
        capacity: Number(slotForm.capacity) || 0,
        isActive: slotForm.isActive,
        note: slotForm.note || "",
      };

      await createServiceCenterSlot(id, slotData);
      
      toast({
        title: "Thành công",
        description: "Tạo slot thành công!",
      });

      // Reset form
      setSlotForm({
        date: "",
        slotTime: "",
        capacity: 0,
        isActive: true,
        note: "",
      });
      setIsCreateSlotOpen(false);

      // Refresh branch detail
      await fetchBranchDetail();
    } catch (error) {
      console.error("Error creating slot:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || error?.message || "Không thể tạo slot. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSlot(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">Đang tải chi tiết chi nhánh...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!branchDetail) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy thông tin chi nhánh</p>
          <Button variant="outline" onClick={() => navigate("/admin/branches")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/admin/branches")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Chi tiết Chi nhánh</h1>
            <p className="text-muted-foreground">Thông tin chi tiết về chi nhánh</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% so với kỳ trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hoàn thành: {summaryStats.completedAppointments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeStaff}/{summaryStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang làm việc / Tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bảo hành</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.confirmedWarranty}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đã xác nhận / Tổng: {summaryStats.totalWarrantyClaims}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    Mã chi nhánh
                  </label>
                  <p className="text-lg font-semibold text-foreground mt-1">{branchDetail.code || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Tên chi nhánh
                  </label>
                  <p className="text-lg font-semibold text-foreground mt-1">{branchDetail.name || "—"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                <p className="text-foreground mt-1 bg-muted/50 p-3 rounded-md">
                  {branchDetail.description || "Không có mô tả"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin liên hệ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-foreground mt-1">{branchDetail.email || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{branchDetail.phone || "—"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </label>
                <p className="text-foreground mt-1">{branchDetail.address || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bản đồ */}
          {(branchDetail.latitude || branchDetail.longitude || branchDetail.address) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Vị trí trên bản đồ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md overflow-hidden border border-border">
                  {(() => {
                    const lat = branchDetail.latitude;
                    const lng = branchDetail.longitude;
                    const address = branchDetail.address;
                    const hasCoords = lat && lng;
                    const q = hasCoords ? `${lat},${lng}` : encodeURIComponent(address || "");
                    const src = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
                    return (
                      <iframe
                        title="branch-map"
                        src={src}
                        style={{ width: "100%", height: 320, border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lịch làm việc */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Lịch làm việc
                  {branchDetail.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {branchDetail.serviceCenterSlots.length} slot
                    </Badge>
                  )}
                </CardTitle>
                <Button onClick={() => setIsCreateSlotOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {branchDetail.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const groupedByDate = branchDetail.serviceCenterSlots.reduce((acc, slot) => {
                      const date = slot.date;
                      if (!acc[date]) {
                        acc[date] = [];
                      }
                      acc[date].push(slot);
                      return acc;
                    }, {});

                    const sortedDates = Object.keys(groupedByDate).sort();

                    return sortedDates.map((date) => {
                      const slots = groupedByDate[date];
                      const firstSlot = slots[0];
                      const vietnameseDay = firstSlot.dayOfWeek === 'Saturday' ? 'Thứ Bảy' : 
                                           firstSlot.dayOfWeek === 'Sunday' ? 'Chủ Nhật' :
                                           firstSlot.dayOfWeek === 'Monday' ? 'Thứ Hai' :
                                           firstSlot.dayOfWeek === 'Tuesday' ? 'Thứ Ba' :
                                           firstSlot.dayOfWeek === 'Wednesday' ? 'Thứ Tư' :
                                           firstSlot.dayOfWeek === 'Thursday' ? 'Thứ Năm' :
                                           firstSlot.dayOfWeek === 'Friday' ? 'Thứ Sáu' : firstSlot.dayOfWeek;

                      return (
                        <div key={date} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-foreground">
                                {vietnameseDay}, {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
                              </h4>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {slots.length} khung giờ
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {slots.map((slot) => (
                              <div
                                key={slot.id}
                                className={`p-3 rounded-md border transition-colors ${
                                  slot.isActive
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">
                                      {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                                    </span>
                                  </div>
                                  {slot.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>Sức chứa: {slot.capacity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có slot nào. Nhấn nút "Tạo slot" để thêm khung giờ làm việc.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog tạo slot */}
          <Dialog open={isCreateSlotOpen} onOpenChange={setIsCreateSlotOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tạo slot mới</DialogTitle>
                <DialogDescription>
                  Thêm khung giờ làm việc mới cho chi nhánh này
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Ngày *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !slotForm.date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {slotForm.date ? format(new Date(slotForm.date), "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={slotForm.date ? new Date(slotForm.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setSlotForm({ ...slotForm, date: format(date, "yyyy-MM-dd") });
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Slot Time */}
                <div className="space-y-2">
                  <Label htmlFor="slotTime">Khung giờ *</Label>
                  <Select
                    value={slotForm.slotTime}
                    onValueChange={(value) => setSlotForm({ ...slotForm, slotTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khung giờ" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label htmlFor="capacity">Sức chứa</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={slotForm.capacity}
                    onChange={(e) => setSlotForm({ ...slotForm, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="Nhập sức chứa"
                  />
                </div>

                {/* Is Active */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={slotForm.isActive}
                    onCheckedChange={(checked) => setSlotForm({ ...slotForm, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer">
                    Kích hoạt slot
                  </Label>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea
                    id="note"
                    value={slotForm.note}
                    onChange={(e) => setSlotForm({ ...slotForm, note: e.target.value })}
                    placeholder="Nhập ghi chú (tùy chọn)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateSlotOpen(false)} disabled={isCreatingSlot}>
                  Hủy
                </Button>
                <Button onClick={handleCreateSlot} disabled={isCreatingSlot}>
                  {isCreatingSlot ? "Đang tạo..." : "Tạo slot"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 sticky top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                className={
                  branchDetail.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100 text-lg px-4 py-2'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100 text-lg px-4 py-2'
                }
              >
                {branchDetail.status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}
              </Badge>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

