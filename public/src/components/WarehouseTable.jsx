import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Package as PackageIcon, AlertCircle } from "lucide-react";

const mockWarehouse = [
  { id: "W001", itemName: "Pin E-Moto S1", category: "Battery", quantity: 45, minStock: 10, unit: "PCS", location: "A1-B2", status: "in-stock" },
  { id: "W002", itemName: "Động cơ Y-Pro", category: "Motor", quantity: 8, minStock: 5, unit: "PCS", location: "B3-C1", status: "in-stock" },
  { id: "W003", itemName: "Lốp xe 18 inch", category: "Tire", quantity: 3, minStock: 15, unit: "PCS", location: "D1-E2", status: "low-stock" },
  { id: "W004", itemName: "ECU Controller X", category: "Controller", quantity: 12, minStock: 8, unit: "PCS", location: "A2-B1", status: "in-stock" },
  { id: "W005", itemName: "Cảm biến tốc độ", category: "Sensor", quantity: 0, minStock: 5, unit: "PCS", location: "C2-D3", status: "out-of-stock" },
  { id: "W006", itemName: "Thắng đĩa", category: "Brake", quantity: 25, minStock: 10, unit: "PCS", location: "E1-F2", status: "in-stock" },
  { id: "W007", itemName: "Khung xe Carbon", category: "Frame", quantity: 6, minStock: 8, unit: "PCS", location: "G1-H1", status: "low-stock" },
];

const getStatusBadge = (status) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "in-stock":
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    case "low-stock":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400`;
    case "out-of-stock":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "in-stock":
      return "Còn hàng";
    case "low-stock":
      return "Sắp hết";
    case "out-of-stock":
      return "Hết hàng";
    default:
      return status;
  }
};

const getCategoryBadge = (category) => {
  const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";
  switch (category) {
    case "Battery":
      return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
    case "Motor":
      return `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400`;
    case "Tire":
      return `${base} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`;
    case "Controller":
      return `${base} bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400`;
    case "Sensor":
      return `${base} bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400`;
    case "Brake":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    case "Frame":
      return `${base} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
  }
};

export default function WarehouseTable({ search = "", category = "", status = "" }) {
  const [rows, setRows] = useState(mockWarehouse);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = rows;

    if (category && category !== "all") {
      result = result.filter((r) => r.category === category);
    }

    if (status && status !== "all") {
      result = result.filter((r) => r.status === status);
    }

    if (q) {
      result = result.filter((r) =>
        [r.id, r.itemName, r.category, r.location].join(" ").toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, search, category, status]);

  useEffect(() => {
    const applyImport = (newItem) => {
      setRows((prev) => {
        const existing = prev.find((r) => r.id === newItem.id);
        if (existing) {
          return prev.map((r) =>
            r.id === newItem.id
              ? { ...r, quantity: r.quantity + newItem.quantity }
              : r
          );
        }
        return [...prev, newItem];
      });
    };

    const applyExport = (itemId, quantity) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === itemId
            ? {
                ...r,
                quantity: Math.max(0, r.quantity - quantity),
                status: Math.max(0, r.quantity - quantity) === 0
                  ? "out-of-stock"
                  : Math.max(0, r.quantity - quantity) < r.minStock
                  ? "low-stock"
                  : "in-stock",
              }
            : r
        )
      );
    };

    window.applyImportToWarehouse = applyImport;
    window.applyExportFromWarehouse = applyExport;

    return () => {
      if (window.applyImportToWarehouse === applyImport) delete window.applyImportToWarehouse;
      if (window.applyExportFromWarehouse === applyExport) delete window.applyExportFromWarehouse;
    };
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Mã SP</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tên hàng</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Danh mục</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Số lượng</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Tồn tối thiểu</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Đơn vị</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vị trí</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 px-6 text-center text-sm text-muted-foreground">
                  No items found
                </td>
              </tr>
            ) : (
              filtered.map((item, i) => (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/10"
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{item.id}</td>
                  <td className="py-4 px-6 text-sm text-foreground">{item.itemName}</td>
                  <td className="py-4 px-6">
                    <span className={getCategoryBadge(item.category)}>{item.category}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-foreground">{item.quantity}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{item.minStock}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{item.unit}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{item.location}</td>
                  <td className="py-4 px-6">
                    <span className={getStatusBadge(item.status)}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

