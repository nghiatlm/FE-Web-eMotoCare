import { useEffect, useState } from "react";
import { Building2, MapPin, Phone, Mail, Clock, Users, Wrench, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffByAccountId } from "@/api/staffsApi";
import { getServiceCenterById } from "@/api/serviceCentersApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function InformationDetail() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceCenter, setServiceCenter] = useState(null);
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy accountId từ user
        const accountId = user?.accountResponse?.id;
        if (!accountId) {
          setError("Không tìm thấy thông tin tài khoản");
          return;
        }

        // Gọi API staffs với accountId
        const staffResponse = await getStaffByAccountId(accountId);
        const staffData = staffResponse?.data?.rowDatas?.[0];
        
        if (!staffData) {
          setError("Không tìm thấy thông tin nhân viên");
          return;
        }

        setStaff(staffData);

        // Lấy serviceCenterId từ staff
        const serviceCenterId = staffData.serviceCenterId;
        if (!serviceCenterId) {
          setError("Không tìm thấy thông tin trung tâm dịch vụ");
          return;
        }

        // Gọi API service center
        const centerResponse = await getServiceCenterById(serviceCenterId);
        const centerData = centerResponse?.data || centerResponse;
        setServiceCenter(centerData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải thông tin. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const formatSlotTime = (slotTime) => {
    if (!slotTime || !slotTime.startsWith("H")) return slotTime;
    const parts = slotTime.replace("H", "").split("_");
    if (parts.length === 2) {
      return `${parts[0]}:00 - ${parts[1]}:00`;
    }
    return slotTime;
  };

  const groupSlotsByDate = (slots) => {
    if (!slots || !Array.isArray(slots)) return {};
    return slots.reduce((acc, slot) => {
      const date = slot.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});
  };

  // Get Vietnamese day name
  const getVietnameseDay = (dayOfWeek) => {
    const days = {
      Monday: "Thứ Hai",
      Tuesday: "Thứ Ba",
      Wednesday: "Thứ Tư",
      Thursday: "Thứ Năm",
      Friday: "Thứ Sáu",
      Saturday: "Thứ Bảy",
      Sunday: "Chủ Nhật",
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!serviceCenter) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Không có dữ liệu</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(serviceCenter.serviceCenterSlots || []);
  const sortedDates = Object.keys(groupedSlots).sort();

  // Tìm manager từ danh sách staffs
  const manager = serviceCenter.staffs?.find(s => s.position === "MANAGER_BRANCH");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Thông tin Chi tiết Trung tâm</h1>
          <p className="text-muted-foreground">Thông tin chi tiết về trung tâm dịch vụ</p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên trung tâm</label>
                <p className="text-lg font-semibold text-foreground mt-1">{serviceCenter.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </label>
                  <p className="text-foreground mt-1">{serviceCenter.address || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{serviceCenter.phone || "—"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-foreground mt-1">{serviceCenter.email || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                <p className="text-foreground mt-1">{serviceCenter.description || "Không có mô tả"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Lịch làm việc
                {serviceCenter.serviceCenterSlots && serviceCenter.serviceCenterSlots.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {serviceCenter.serviceCenterSlots.length} slot
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedDates.length > 0 ? (
                <div className="space-y-4">
                  {sortedDates.map((date) => {
                    const slots = groupedSlots[date];
                    const firstSlot = slots[0];
                    const vietnameseDay = getVietnameseDay(firstSlot.dayOfWeek);

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                                <span className="text-sm font-medium text-foreground">
                                  {formatSlotTime(slot.slotTime)}
                                </span>
                                <Badge
                                  variant={slot.isActive ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {slot.isActive ? "Hoạt động" : "Tạm dừng"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Sức chứa: {slot.capacity}
                              </div>
                              {slot.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {slot.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Chưa có lịch làm việc nào được thiết lập</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 sticky top-9 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-lg px-4 py-2 ${
                  serviceCenter.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400"
                }`}
              >
                {serviceCenter.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
              </Badge>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã trung tâm</span>
                  <span className="text-foreground font-medium">{serviceCenter.code || serviceCenter.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {manager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Quản lý
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên quản lý</label>
                  <p className="text-foreground font-semibold mt-1">
                    {manager.firstName} {manager.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mã nhân viên</label>
                  <p className="text-foreground mt-1">{manager.staffCode || "—"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tổng nhân viên</span>
                <span className="text-2xl font-bold text-foreground">
                  {serviceCenter.staffs?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số slot lịch</span>
                <span className="text-2xl font-bold text-primary">
                  {serviceCenter.serviceCenterSlots?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Slot đang hoạt động</span>
                <span className="text-2xl font-bold text-green-600">
                  {serviceCenter.serviceCenterSlots?.filter(s => s.isActive).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
