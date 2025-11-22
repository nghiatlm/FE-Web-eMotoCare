import { useEffect, useState } from "react";
import { Search, Plus, Filter, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import BranchesTable from "@/components/BranchesTable";
import { createServiceCenter, updateServiceCenter } from "@/api/serviceCentersApi";

export default function Branches() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [manager, setManager] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    email: "",
    location: "",
    phone: "",
    manager: "",
    hours: "",
    status: "active",
    latitude: "",
    longitude: "",
  });

  const resetForm = () => {
    setForm({ code: "", name: "", description: "", email: "", location: "", phone: "", manager: "", hours: "", status: "active", latitude: "", longitude: "" });
  };

  useEffect(() => {
    // Handlers called from table action buttons
    window.openEditBranch = (row) => {
      setSelected(row);
      setForm({
        code: row.code || "",
        name: row.name || "",
        description: row.description || "",
        email: row.email || "",
        location: row.location || "",
        phone: row.phone || "",
        manager: row.manager || "",
        hours: row.hours || "",
        status: row.status || "active",
        latitude: row.latitude || "",
        longitude: row.longitude || "",
      });
      setIsEditOpen(true);
    };
    return () => {
      if (window.openEditBranch) delete window.openEditBranch;
    };
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const tmpId = `BR-${Date.now()}`;
    const statusUpper = String(form.status || "active").toUpperCase();

    // Build API body per backend contract
    const body = {
      code: form.code || `SC-${Date.now()}`,
      name: form.name,
      description: form.description || "",
      email: form.email || "",
      phone: form.phone,
      address: form.location,
      latitude: form.latitude || "",
      longitude: form.longitude || "",
      status: statusUpper,
    };

    try {
      const res = await createServiceCenter(body);
      const created = res?.data || res;
      const mapped = {
        id: created?.id || created?.code || tmpId,
        code: created?.code || form.code,
        name: created?.name || form.name,
        location: created?.address || form.location,
        phone: created?.phone || form.phone,
        email: created?.email || form.email,
        description: created?.description || form.description,
        manager: form.manager,
        hours: form.hours,
        status: String((created?.status || form.status || "active")).toLowerCase(),
        latitude: created?.latitude || form.latitude,
        longitude: created?.longitude || form.longitude,
      };
      window?.applyAddBranch?.(mapped);
    } catch (err) {
      const newBranch = { id: tmpId, ...form };
      window?.applyAddBranch?.(newBranch);
    } finally {
      setIsAddOpen(false);
      resetForm();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selected?.id) return;

    const statusUpper = String(form.status || "active").toUpperCase();
    const body = {
      code: form.code,
      name: form.name,
      description: form.description || "",
      email: form.email || "",
      phone: form.phone,
      address: form.location,
      latitude: form.latitude || "",
      longitude: form.longitude || "",
      status: statusUpper,
    };

    try {
      const res = await updateServiceCenter(selected.id, body);
      const updated = res?.data || res;
      const mapped = {
        code: updated?.code ?? form.code,
        name: updated?.name ?? form.name,
        description: updated?.description ?? form.description,
        email: updated?.email ?? form.email,
        location: updated?.address ?? form.location,
        phone: updated?.phone ?? form.phone,
        manager: form.manager,
        hours: form.hours,
        status: String((updated?.status || form.status || "active")).toLowerCase(),
        latitude: updated?.latitude ?? form.latitude,
        longitude: updated?.longitude ?? form.longitude,
      };
      window?.applyEditBranch?.(selected.id, mapped);
    } catch (err) {
      // Fallback to local update if API fails
      window?.applyEditBranch?.(selected.id, { ...form });
    } finally {
      setIsEditOpen(false);
      setSelected(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Quản lý chi nhánh</h1>
          </div>
          <p className="text-muted-foreground ml-11">Theo dõi và quản lý hệ thống chi nhánh</p>
        </div>

        <Card className="mb-6 shadow-lg border border-slate-200/80 rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm chi nhánh"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>


              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                  <SelectItem value="suspended">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>

              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger className="w-[200px] h-10">
                  <SelectValue placeholder="Quản lý" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Dung">Dung</SelectItem>
                  <SelectItem value="Thuận">Thuận</SelectItem>
                  <SelectItem value="Alex">Alex</SelectItem>
                  <SelectItem value="Linh">Linh</SelectItem>
                  <SelectItem value="Việt">Việt</SelectItem>
                  <SelectItem value="Tâm">Tâm</SelectItem>
                  <SelectItem value="Hoàng">Hoàng</SelectItem>
                  <SelectItem value="Vương">Vương</SelectItem>
                </SelectContent>
              </Select>

              {(status || manager || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatus("");
                    setManager("");
                    setSearch("");
                  }}
                  className="text-primary hover:text-primary/90 hover:bg-primary/10"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Xóa lọc
                </Button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" 
                  onClick={() => setIsAddOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Thêm chi nhánh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <BranchesTable search={search} status={status} manager={manager} />

        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm chi nhánh</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên chi nhánh</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: GreenWheel" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã chi nhánh (code)</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="VD: SC-HCM-001" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="VD: alo@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về chi nhánh" />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="VD: 123 Đường Lê Lợi" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="VD: 098xxxxxxx" required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giờ hoạt động</Label>
                  <Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder="VD: 08:00 – 17:00 (T2 – T7)" required/>
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
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); }}>Hủy</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Thêm</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa chi nhánh</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên chi nhánh</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã chi nhánh (code)</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giờ hoạt động</Label>
                  <Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} required/>
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
                      <SelectItem value="suspended">Suspended</SelectItem>
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

      </div>
    </div>
  );
}


