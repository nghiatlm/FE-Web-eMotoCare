import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Clock, Users, Hash, Info, Calendar, FileText, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceCenterById } from "@/api/serviceCentersApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchBranchDetail();
  }, [id]);

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
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/admin/branches/${id}/report`)}>
              <FileText className="h-4 w-4 mr-2" />
              Xem báo cáo
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </div>
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
          {branchDetail.serviceCenterSlots && branchDetail.serviceCenterSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Lịch làm việc
                  <Badge variant="secondary" className="ml-2">
                    {branchDetail.serviceCenterSlots.length} slot
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
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

          {/* Report Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Xem báo cáo chi tiết về hoạt động của chi nhánh, bao gồm doanh thu, lịch hẹn, hiệu suất nhân viên và thống kê bảo hành.
              </p>
              <Button className="w-full" onClick={() => navigate(`/admin/branches/${id}/report`)}>
                <FileText className="h-4 w-4 mr-2" />
                Xem báo cáo chi tiết
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

