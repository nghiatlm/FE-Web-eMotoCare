import { useEffect, useState } from "react";
import { Search, Plus, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BranchesTable from "@/components/BranchesTable";

export default function Branches() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [manager, setManager] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    manager: "",
    hours: "",
    status: "active",
  });

  const resetForm = () => {
    setForm({ name: "", location: "", phone: "", manager: "", hours: "", status: "active" });
  };

  useEffect(() => {
    // Handlers called from table action buttons
    window.openEditBranch = (row) => {
      setSelected(row);
      setForm({
        name: row.name || "",
        location: row.location || "",
        phone: row.phone || "",
        manager: row.manager || "",
        hours: row.hours || "",
        status: row.status || "active",
      });
      setIsEditOpen(true);
    };
    window.openViewBranch = (row) => {
      setSelected(row);
      setIsViewOpen(true);
    };
    return () => {
      if (window.openEditBranch) delete window.openEditBranch;
      if (window.openViewBranch) delete window.openViewBranch;
    };
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const id = `BR-${Date.now()}`;
    const newBranch = { id, ...form };
    window?.applyAddBranch?.(newBranch);
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;
    window?.applyEditBranch?.(selected.id, { ...form });
    setIsEditOpen(false);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Branch Management</h1>
          <p className="text-muted-foreground">Quản lý chi nhánh</p>
        </div>

        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm chi nhánh"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>


            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

          <Select value={manager} onValueChange={setManager}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Dũng">Dũng</SelectItem>
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
                className="text-primary hover:text-primary/90"
              >
                Clear Filters
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Thêm chi nhánh
              </Button>
            </div>
          </div>
        </div>

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
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="VD: 123 Đường Lê Lợi" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="VD: 098xxxxxxx" required/>
                </div>
                <div className="space-y-2">
                  <Label>Quản lý</Label>
                  <Select value={form.manager} onValueChange={(v) => setForm((f) => ({ ...f, manager: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quản lý" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dũng">Dũng</SelectItem>
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
                  <Label>Số điện thoại</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label>Quản lý</Label>
                  <Select value={form.manager} onValueChange={(v) => setForm((f) => ({ ...f, manager: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quản lý" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dũng">Dũng</SelectItem>
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

        <Dialog open={isViewOpen} onOpenChange={(o) => { setIsViewOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết chi nhánh</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Mã chi nhánh:</span> <span className="font-medium">{selected?.id}</span></div>
              <div><span className="text-muted-foreground">Tên:</span> <span className="font-medium">{selected?.name}</span></div>
              <div><span className="text-muted-foreground">Địa chỉ:</span> <span className="font-medium">{selected?.location}</span></div>
              <div><span className="text-muted-foreground">SĐT:</span> <span className="font-medium">{selected?.phone}</span></div>
              <div><span className="text-muted-foreground">Quản lý:</span> <span className="font-medium">{selected?.manager}</span></div>
              <div><span className="text-muted-foreground">Giờ hoạt động:</span> <span className="font-medium">{selected?.hours}</span></div>
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


