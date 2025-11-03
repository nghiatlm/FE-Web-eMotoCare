import { useState } from "react";
import { ArrowLeft, Check, MapPin, Building2, Image as ImageIcon, AlertTriangle, Package, TrendingUp, Calendar, User, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function AccessoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Mock data
  const accessory = {
    id: "OIL002",
    name: "Dầu nhớt Castrol 10W40",
    image: "",
    unit: "Chai",
    availableStock: 7,
    minStock: 8,
    totalStock: 7,
    branch: "Chi nhánh Quận 1",
    shelfLocation: "",
    warningThreshold: "",
    status: "low",
    lastUpdated: "20:09 23/09/2025"
  };

  const adjustmentHistory = [
    {
      time: "20:09 23/09/2025",
      operator: "Bảo Trân",
      type: "increase",
      quantity: 2,
      note: "Nhập hàng"
    }
  ];

  const getStockStatusBadge = (status) => {
    switch (status) {
      case "sufficient":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "low":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "out":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStockStatusText = (status) => {
    switch (status) {
      case "sufficient":
        return "Đủ";
      case "low":
        return "Sắp hết";
      case "out":
        return "Hết";
      default:
        return status;
    }
  };

  const progressPercentage = (accessory.availableStock / accessory.minStock) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/storekeeper')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {accessory.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                Mã sản phẩm: <span className="font-semibold text-primary">{accessory.id}</span>
              </p>
            </div>
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg" 
              onClick={() => setIsAdjustOpen(true)}
            >
              <Check className="h-5 w-5" />
              Điều chỉnh tồn kho
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {accessory.status === "low" && (
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-2 text-lg">⚠️ Cảnh báo tồn kho thấp</h3>
                <p className="text-amber-800 mb-4">
                  Phụ tùng <span className="font-semibold">{accessory.name}</span> chỉ còn{" "}
                  <span className="font-bold text-amber-900 text-xl">{accessory.availableStock}</span> {accessory.unit}, 
                  thấp hơn ngưỡng tối thiểu ({accessory.minStock} {accessory.unit}).
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-600 text-amber-800 hover:bg-amber-100"
                >
                  📢 Báo thiếu hàng
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Product Image Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-muted/30">
            <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl mb-4">
              <ImageIcon className="h-32 w-32 text-primary/40" />
            </div>
            <Badge className={getStockStatusBadge(accessory.status)}>
              {getStockStatusText(accessory.status)}
            </Badge>
          </Card>

          {/* Info Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Stock Display */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-200 text-orange-900 hover:bg-orange-200">
                  {progressPercentage.toFixed(0)}%
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tồn kho hiện tại</p>
                <h2 className="text-4xl font-bold text-orange-700">{accessory.availableStock}</h2>
                <p className="text-sm text-muted-foreground">/ {accessory.minStock} {accessory.unit} (Ngưỡng tối thiểu)</p>
                <div className="mt-4">
                  <Progress 
                    value={progressPercentage > 100 ? 100 : progressPercentage} 
                    className="h-2" 
                  />
                </div>
              </div>
            </Card>

            {/* Location Card */}
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Vị trí kệ</p>
                  <p className="text-2xl font-bold text-foreground">B2-05</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Chi nhánh</p>
                <p className="font-medium">{accessory.branch}</p>
              </div>
            </Card>

            {/* Quick Info Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Thông tin cơ bản</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Mã phụ tùng:</span>
                  <span className="text-sm font-semibold text-primary">{accessory.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Đơn vị:</span>
                  <span className="text-sm font-medium">{accessory.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tổng tồn:</span>
                  <span className="text-sm font-medium">{accessory.totalStock} {accessory.unit}</span>
                </div>
              </div>
            </Card>

            {/* Last Updated Card */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Cập nhật gần nhất</p>
                  <p className="text-lg font-bold text-foreground">{accessory.lastUpdated}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Adjustment History */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border bg-gradient-to-r from-card to-muted/30">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Lịch sử điều chỉnh</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Thời gian</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Người thao tác</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Loại điều chỉnh</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Số lượng</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentHistory.map((adj, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-foreground">{adj.time}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {adj.operator.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium">{adj.operator}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={adj.type === "increase" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                        {adj.type === "increase" ? "+ Tăng" : "- Giảm"}
                      </Badge>
                    </td>
                    <td className={`py-4 px-6 text-sm font-bold ${adj.type === "increase" ? "text-green-600" : "text-red-600"}`}>
                      {adj.type === "increase" ? "+" : "-"}{adj.quantity} {accessory.unit}
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{adj.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">📊 Hiển thị 1-1 của 1 giao dịch</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>‹</Button>
              <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
              <Button variant="outline" size="sm" disabled>›</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Adjust Inventory Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <DialogTitle className="text-2xl">Điều chỉnh tồn kho</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Sản phẩm: <span className="font-semibold text-foreground">{accessory.name}</span>
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Loại điều chỉnh</Label>
              <Select defaultValue="increase">
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase" className="text-green-600">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Tăng số lượng (+)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="decrease" className="text-red-600">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4" />
                      <span>Giảm số lượng (-)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Số lượng điều chỉnh</Label>
              <Input type="number" placeholder="Nhập số lượng" className="h-12" />
              <p className="text-xs text-muted-foreground">Đơn vị: {accessory.unit}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Ghi chú (tùy chọn)</Label>
              <Input placeholder="VD: Nhập hàng từ nhà cung cấp" className="h-12" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustOpen(false)} className="px-6">
              Hủy
            </Button>
            <Button onClick={() => setIsAdjustOpen(false)} className="px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

