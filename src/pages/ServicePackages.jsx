import { useEffect, useState } from "react";
import { Search, Plus, Filter, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ServicePackagesTable from "@/components/ServicePackagesTable";

export default function ServicePackages() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "Maintenance",
    status: "active",
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      duration: "",
      category: "Maintenance",
      status: "active",
    });
  };

  useEffect(() => {
    window.openEditServicePackage = (row) => {
      setSelected(row);
      setForm({
        name: row.name || "",
        description: row.description || "",
        price: row.price || "",
        duration: row.duration || "",
        category: row.category || "Maintenance",
        status: row.status || "active",
      });
      setIsEditOpen(true);
    };
    window.openViewServicePackage = (row) => {
      setSelected(row);
      setIsViewOpen(true);
    };
    return () => {
      if (window.openEditServicePackage) delete window.openEditServicePackage;
      if (window.openViewServicePackage) delete window.openViewServicePackage;
    };
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const id = `SP-${Date.now()}`;
    const newPackage = { id, ...form };
    window?.applyAddServicePackage?.(newPackage);
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;
    window?.applyEditServicePackage?.(selected.id, { ...form });
    setIsEditOpen(false);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Service Packages Management</h1>
          </div>
          <p className="text-muted-foreground">Quản lý các gói dịch vụ</p>
        </div>

        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm gói dịch vụ"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Repair">Repair</SelectItem>
                <SelectItem value="Warranty">Warranty</SelectItem>
                <SelectItem value="Upgrade">Upgrade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {(category || status || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("");
                  setStatus("");
                  setSearch("");
                }}
                className="text-primary hover:text-primary/90"
              >
                Clear Filters
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Thêm gói dịch vụ
              </Button>
            </div>
          </div>
        </div>

        <ServicePackagesTable search={search} category={category} status={status} />

        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm gói dịch vụ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên gói dịch vụ</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Bảo dưỡng định kỳ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả gói dịch vụ"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá (VNĐ)</Label>
                  <Input
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="VD: 500000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời hạn</Label>
                  <Input
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="VD: 6 months"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Warranty">Warranty</SelectItem>
                      <SelectItem value="Upgrade">Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Thêm</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên gói dịch vụ</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá (VNĐ)</Label>
                  <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Thời hạn</Label>
                  <Input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Warranty">Warranty</SelectItem>
                      <SelectItem value="Upgrade">Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Hủy</Button>
                <Button type="submit">Lưu</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={(o) => { setIsViewOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết gói dịch vụ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">ID:</span> <span className="font-medium">{selected?.id}</span></div>
              <div><span className="text-muted-foreground">Tên:</span> <span className="font-medium">{selected?.name}</span></div>
              <div><span className="text-muted-foreground">Mô tả:</span> <span className="font-medium">{selected?.description}</span></div>
              <div><span className="text-muted-foreground">Giá:</span> <span className="font-medium">{selected?.price}đ</span></div>
              <div><span className="text-muted-foreground">Thời hạn:</span> <span className="font-medium">{selected?.duration}</span></div>
              <div><span className="text-muted-foreground">Danh mục:</span> <span className="font-medium">{selected?.category}</span></div>
              <div><span className="text-muted-foreground">Trạng thái:</span> <span className="font-medium">{selected?.status}</span></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

