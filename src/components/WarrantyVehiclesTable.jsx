import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Eye } from "lucide-react";

// Device warranty sample data (matching screenshot semantics)
const mockVehicles = [
  { id: "DEV-001", serial: "SN123456789", model: "Battery X1", owner: "Alex Nguyen", start: "2023-01-15", expiry: "2026-01-15" },
  { id: "DEV-002", serial: "SN987654321", model: "E-Moto S1", owner: "Sarah Johnson", start: "2022-06-20", expiry: "2024-06-20" },
  { id: "DEV-003", serial: "SN456789123", model: "Motor Y-Pro", owner: "John Smith", start: "2021-03-10", expiry: "2023-03-10" },
  { id: "DEV-004", serial: "SN789123456", model: "E-Moto Pro", owner: "Mike Chen", start: "2023-08-05", expiry: "2026-08-05" },
  { id: "DEV-005", serial: "SN321654987", model: "Battery Z3", owner: "John Smith", start: "2022-11-12", expiry: "2024-11-12" },
  { id: "DEV-006", serial: "SN159753486", model: "E-Moto Lite", owner: "Emily Davis", start: "2022-11-12", expiry: "2024-11-12" },
  { id: "DEV-007", serial: "SN258456123", model: "ECU Controller X", owner: "John Smith", start: "2023-01-15", expiry: "2026-01-15" },
  { id: "DEV-008", serial: "SN357951456", model: "E-Moto Cargo", owner: "David Wilson", start: "2022-11-12", expiry: "2026-06-20" },
  { id: "DEV-009", serial: "SN456123789", model: "Battery Y5", owner: "Daniel Dang", start: "2021-03-10", expiry: "2023-03-10" },
];

const statusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  if (status === "Active") return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
  return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
};

export function WarrantyVehiclesTable({
  search = "",
  modelFilter = "",
  warrantyFilter = "",
  startDate = "",
  endDate = "",
}) {
  const [rows] = useState(mockVehicles);
  const [data, setData] = useState(mockVehicles);

  useEffect(() => {
    // Expose mutators so parent forms can update the table
    const applyAdd = (device) => {
      setData((prev) => {
        const exists = prev.some((r) => r.id === device.id);
        if (exists) return prev;
        return [...prev, device];
      });
    };
    const applyEdit = (deviceId, updates) => {
      setData((prev) => prev.map((r) => (r.id === deviceId ? { ...r, ...updates } : r)));
    };
    window.applyAddDevice = applyAdd;
    window.applyEditDevice = applyEdit;
    return () => {
      if (window.applyAddDevice === applyAdd) delete window.applyAddDevice;
      if (window.applyEditDevice === applyEdit) delete window.applyEditDevice;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date();

    return data.filter((r) => {
      // Search
      const matchesSearch = !q
        ? true
        : [r.id, r.serial, r.model, r.owner].join(" ").toLowerCase().includes(q);

      // Model filter
      const matchesModel = !modelFilter || modelFilter === "all" || r.model === modelFilter;

      // Warranty status (Active/Expired) filter
      const isActive = new Date(r.expiry) >= today;
      const matchesWarranty =
        !warrantyFilter ||
        warrantyFilter === "all" ||
        (warrantyFilter === "Active" && isActive) ||
        (warrantyFilter === "Expired" && !isActive);

      // Date range filters
      const startOk = !startDate || new Date(r.start) >= new Date(startDate);
      const endOk = !endDate || new Date(r.expiry) <= new Date(endDate);

      return matchesSearch && matchesModel && matchesWarranty && startOk && endOk;
    });
  }, [rows, search, modelFilter, warrantyFilter, startDate, endDate]);

  const hasActiveFilters =
    (modelFilter && modelFilter !== "all") ||
    (warrantyFilter && warrantyFilter !== "all") ||
    !!startDate || !!endDate || !!search;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {hasActiveFilters ? `Showing ${filtered.length} of ${data.length} devices` : `Showing ${data.length} devices`}
      </p>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Device ID</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Serial Number</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Model</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Owner</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Warranty Start</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Warranty Expiry</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center text-sm text-muted-foreground">No devices found</td>
              </tr>
            ) : (
              filtered.map((v, i) => {
                const active = new Date(v.expiry) >= new Date();
                return (
                  <tr key={v.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}>
                    <td className="py-4 px-6 text-sm font-medium text-foreground">{v.id}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{v.serial}</td>
                    <td className="py-4 px-6 text-sm text-foreground">{v.model}</td>
                    <td className="py-4 px-6 text-sm text-foreground">{v.owner}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{v.start}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{v.expiry}</td>
                    <td className="py-4 px-6"><span className={statusBadge(active ? "Active" : "Expired")}>{active ? "Active" : "Expired"}</span></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit" onClick={() => window?.openEditWarrantyVehicle?.(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="View details" onClick={() => window?.openViewWarrantyVehicle?.(v)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
  

export default WarrantyVehiclesTable;


