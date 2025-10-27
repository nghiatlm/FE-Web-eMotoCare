import { useEffect, useState } from "react";
import { Search, Download, Filter, Cpu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import WarrantyVehiclesTable from "@/components/WarrantyVehiclesTable";

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [warrantyFilter, setWarrantyFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [form, setForm] = useState({
    serial: "",
    model: "",
    owner: "",
    start: null,
    expiry: null,
  });

  const resetForm = () => setForm({ serial: "", model: "", owner: "", start: null, expiry: null });

  useEffect(() => {
    window.openEditWarrantyVehicle = (row) => { setSelected(row); setIsEditOpen(true); };
    window.openViewWarrantyVehicle = (row) => { setSelected(row); setIsViewOpen(true); };
    return () => {
      delete window.openEditWarrantyVehicle;
      delete window.openViewWarrantyVehicle;
    };
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const id = `DEV-${Date.now()}`;
    window?.applyAddDevice?.({
      id,
      serial: form.serial,
      model: form.model,
      owner: form.owner,
      start: form.start ? format(form.start, "yyyy-MM-dd") : "",
      expiry: form.expiry ? format(form.expiry, "yyyy-MM-dd") : "",
    });
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;
    window?.applyEditDevice?.(selected.id, {
      serial: form.serial || selected.serial,
      model: form.model || selected.model,
      owner: form.owner || selected.owner,
      start: form.start ? format(form.start, "yyyy-MM-dd") : selected.start,
      expiry: form.expiry ? format(form.expiry, "yyyy-MM-dd") : selected.expiry,
    });
    setIsEditOpen(false);
    setSelected(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
          <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Warranty Device Management</h1>
          </div>
          <p className="text-muted-foreground">Manage and monitor device warranties</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add new device
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>

          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Device Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Battery X1">Battery X1</SelectItem>
              <SelectItem value="E-Moto S1">E-Moto S1</SelectItem>
              <SelectItem value="Battery Z3">Battery Z3</SelectItem>
              <SelectItem value="Motor Y-Pro">Motor Y-Pro</SelectItem>
              <SelectItem value="E-Moto Pro">E-Moto Pro</SelectItem>
              <SelectItem value="E-Moto Lite">E-Moto Lite</SelectItem>
              <SelectItem value="ECU Controller X">ECU Controller X</SelectItem>
              <SelectItem value="E-Moto Cargo">E-Moto Cargo</SelectItem>
              <SelectItem value="Battery Y5">Battery Y5</SelectItem>
            </SelectContent>
          </Select>

          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Warranty Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-[180px] justify-start text-left font-normal ${!startDate ? "text-muted-foreground" : ""}`}
              >
                <Filter className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-[180px] justify-start text-left font-normal ${!endDate ? "text-muted-foreground" : ""}`}
              >
                <Filter className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(modelFilter || warrantyFilter || startDate || endDate || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setModelFilter(""); setWarrantyFilter(""); setStartDate(null); setEndDate(null); setSearch(""); }}
              className="text-primary hover:text-primary/90"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <WarrantyVehiclesTable
          search={search}
          modelFilter={modelFilter}
          warrantyFilter={warrantyFilter}
          startDate={startDate ? format(startDate, "yyyy-MM-dd") : ""}
          endDate={endDate ? format(endDate, "yyyy-MM-dd") : ""}
        />

        <Dialog open={isViewOpen} onOpenChange={(o) => { setIsViewOpen(o); if (!o) setSelected(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Device details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Vehicle ID:</span> <span className="font-medium">{selected?.id}</span></div>
              <div><span className="text-muted-foreground">Serial Number:</span> <span className="font-medium">{selected?.serial}</span></div>
              <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{selected?.model}</span></div>
              <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{selected?.owner}</span></div>
              <div><span className="text-muted-foreground">Warranty Start:</span> <span className="font-medium">{selected?.start}</span></div>
              <div><span className="text-muted-foreground">Warranty Expiry:</span> <span className="font-medium">{selected?.expiry}</span></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setSelected(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} placeholder={selected?.serial || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={selected?.model || "Select model"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Battery X1">Battery X1</SelectItem>
                      <SelectItem value="E-Moto S1">E-Moto S1</SelectItem>
                      <SelectItem value="Battery Z3">Battery Z3</SelectItem>
                      <SelectItem value="Motor Y-Pro">Motor Y-Pro</SelectItem>
                      <SelectItem value="E-Moto Pro">E-Moto Pro</SelectItem>
                      <SelectItem value="E-Moto Lite">E-Moto Lite</SelectItem>
                      <SelectItem value="ECU Controller X">ECU Controller X</SelectItem>
                      <SelectItem value="E-Moto Cargo">E-Moto Cargo</SelectItem>
                      <SelectItem value="Battery Y5">Battery Y5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder={selected?.owner || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Warranty Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!form.start ? "text-muted-foreground" : ""}`}>
                        {form.start ? format(form.start, "PPP") : selected?.start || "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={form.start} onSelect={(d) => setForm((f) => ({ ...f, start: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warranty Expiry</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!form.expiry ? "text-muted-foreground" : ""}`}>
                        {form.expiry ? format(form.expiry, "PPP") : selected?.expiry || "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={form.expiry} onSelect={(d) => setForm((f) => ({ ...f, expiry: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} placeholder="SN..." required />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Battery X1">Battery X1</SelectItem>
                      <SelectItem value="E-Moto S1">E-Moto S1</SelectItem>
                      <SelectItem value="Battery Z3">Battery Z3</SelectItem>
                      <SelectItem value="Motor Y-Pro">Motor Y-Pro</SelectItem>
                      <SelectItem value="E-Moto Pro">E-Moto Pro</SelectItem>
                      <SelectItem value="E-Moto Lite">E-Moto Lite</SelectItem>
                      <SelectItem value="ECU Controller X">ECU Controller X</SelectItem>
                      <SelectItem value="E-Moto Cargo">E-Moto Cargo</SelectItem>
                      <SelectItem value="Battery Y5">Battery Y5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder="Owner name" required />
                </div>
                <div className="space-y-2">
                  <Label>Warranty Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!form.start ? "text-muted-foreground" : ""}`}>
                        {form.start ? format(form.start, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={form.start} onSelect={(d) => setForm((f) => ({ ...f, start: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warranty Expiry</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!form.expiry ? "text-muted-foreground" : ""}`}>
                        {form.expiry ? format(form.expiry, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={form.expiry} onSelect={(d) => setForm((f) => ({ ...f, expiry: d }))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


