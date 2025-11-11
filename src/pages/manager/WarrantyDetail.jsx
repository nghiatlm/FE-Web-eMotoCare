import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Calendar, FileText, CheckCircle2, XCircle, Clock, AlertCircle, Building2, Package, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WarrantyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data - sẽ thay bằng API call sau
  const warrantyClaim = {
    id: "WC-001",
    deviceModel: "KLARAS",
    serialNumber: "SN-2024-001",
    issueDescription: "Pin không sạc được, màn hình hiển thị lỗi. Khách hàng báo cáo rằng sau khi sạc qua đêm, pin vẫn không đầy và màn hình hiển thị thông báo lỗi. Đã thử sạc bằng bộ sạc khác nhưng vẫn không được.",
    submittedDate: "2024-01-10",
    ownerName: "Nguyễn Văn A",
    ownerPhone: "0901234567",
    ownerEmail: "nguyenvana@example.com",
    status: "pending",
    purchaseDate: "2023-06-15",
    warrantyExpiryDate: "2024-06-15",
    serviceCenter: "GreenWheel - Chi nhánh Hồ Chí Minh",
    serviceCenterAddress: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    serviceCenterPhone: "028 3829 1234",
    notes: "Khách hàng phàn nàn về việc pin không sạc được sau 6 tháng sử dụng. Cần kiểm tra kỹ hệ thống sạc và pin.",
    priority: "high",
    purchasePrice: "25,000,000 VNĐ",
    invoiceNumber: "INV-2023-0615-001",
    repairHistory: [
      {
        date: "2023-08-20",
        description: "Bảo dưỡng định kỳ",
        status: "completed",
      },
      {
        date: "2023-10-15",
        description: "Thay thế phụ tùng nhỏ",
        status: "completed",
      },
    ],
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1 text-lg px-4 py-2">
            <Clock className="h-4 w-4" />
            Chờ xác nhận
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 text-lg px-4 py-2">
            <CheckCircle2 className="h-4 w-4" />
            Đã xác nhận
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 text-lg px-4 py-2">
            <XCircle className="h-4 w-4" />
            Đã từ chối
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ưu tiên cao</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ưu tiên trung bình</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Ưu tiên thấp</Badge>;
      default:
        return null;
    }
  };

  const isWarrantyValid = new Date(warrantyClaim.warrantyExpiryDate) >= new Date();

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Thành công",
        description: "Đã xác nhận yêu cầu bảo hành thành công",
      });
      
      setIsConfirmDialogOpen(false);
      // Navigate back to list or update status
      navigate("/manager/warranty");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xác nhận yêu cầu bảo hành",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Thành công",
        description: "Đã từ chối yêu cầu bảo hành",
      });
      
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      // Navigate back to list or update status
      navigate("/manager/warranty");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối yêu cầu bảo hành",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/manager/warranty")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Chi tiết Yêu cầu Bảo hành</h1>
            <p className="text-muted-foreground">Mã yêu cầu: {warrantyClaim.id}</p>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(warrantyClaim.status)}
            {getPriorityBadge(warrantyClaim.priority)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                  <p className="text-lg font-semibold text-foreground mt-1">{warrantyClaim.ownerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </label>
                  <p className="text-foreground mt-1">{warrantyClaim.ownerPhone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-foreground mt-1">{warrantyClaim.ownerEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Thông tin sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p className="text-lg font-semibold text-foreground mt-1">{warrantyClaim.deviceModel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Số serial</label>
                  <p className="text-foreground mt-1">{warrantyClaim.serialNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ngày mua
                  </label>
                  <p className="text-foreground mt-1">{new Date(warrantyClaim.purchaseDate).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Hạn bảo hành
                  </label>
                  <p className="text-foreground mt-1">{new Date(warrantyClaim.warrantyExpiryDate).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Giá mua</label>
                  <p className="text-foreground mt-1">{warrantyClaim.purchasePrice}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Số hóa đơn</label>
                  <p className="text-foreground mt-1">{warrantyClaim.invoiceNumber}</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isWarrantyValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {isWarrantyValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${isWarrantyValid ? 'text-green-800' : 'text-red-800'}`}>
                    {isWarrantyValid ? "Sản phẩm còn trong thời hạn bảo hành" : "Sản phẩm đã hết hạn bảo hành"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Mô tả vấn đề
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{warrantyClaim.issueDescription}</p>
            </CardContent>
          </Card>

          {/* Service Center Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin trung tâm dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên trung tâm</label>
                <p className="text-foreground mt-1">{warrantyClaim.serviceCenter}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Địa chỉ</label>
                <p className="text-foreground mt-1">{warrantyClaim.serviceCenterAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                <p className="text-foreground mt-1">{warrantyClaim.serviceCenterPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Ghi chú
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{warrantyClaim.notes}</p>
            </CardContent>
          </Card>

          {/* Repair History */}
          {warrantyClaim.repairHistory && warrantyClaim.repairHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử sửa chữa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {warrantyClaim.repairHistory.map((repair, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{repair.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(repair.date).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {warrantyClaim.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Thao tác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setIsConfirmDialogOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Xác nhận bảo hành
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsRejectDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối yêu cầu
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mã yêu cầu</span>
                <span className="font-medium text-foreground">{warrantyClaim.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ngày gửi</span>
                <span className="font-medium text-foreground">
                  {new Date(warrantyClaim.submittedDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trạng thái</span>
                {getStatusBadge(warrantyClaim.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ưu tiên</span>
                {getPriorityBadge(warrantyClaim.priority)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận bảo hành</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận yêu cầu bảo hành này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu bảo hành</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối yêu cầu bảo hành này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Lý do từ chối *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Đang xử lý..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

