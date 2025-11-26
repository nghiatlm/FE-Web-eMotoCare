import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { 
  FileText,
  Upload
} from "lucide-react";
import BatteryImportModal from "./BatteryImportModal";
import { toast } from "@/components/ui/sonner";

export default function BatteryDataDisplay({ evCheckDetailId, canImport = true }) {
  const navigate = useNavigate();
  const [batteryData, setBatteryData] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ✅ Lấy key để lưu vào localStorage
  const getStorageKey = (id) => `battery_data_${id}`;

  // ✅ Load dữ liệu từ localStorage khi component mount hoặc evCheckDetailId thay đổi
  useEffect(() => {
    if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
      return;
    }

    const storageKey = getStorageKey(evCheckDetailId);
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && (parsedData.id || parsedData.sampleCount !== undefined)) {
          console.log("🔋 Loaded battery data from localStorage:", parsedData);
          setBatteryData(parsedData);
        }
      } catch (error) {
        console.error("🔋 Error parsing saved battery data:", error);
        localStorage.removeItem(storageKey);
      }
    }
  }, [evCheckDetailId]);

  const handleImportSuccess = (importedData) => {
    // ✅ Lưu dữ liệu từ response import vào state
    if (importedData && (importedData.id || importedData.sampleCount !== undefined)) {
      console.log("🔋 Using imported data:", importedData);
      setBatteryData(importedData);
      
      // ✅ Lưu vào localStorage để load lại sau
      if (evCheckDetailId && !evCheckDetailId.startsWith("temp_")) {
        const storageKey = getStorageKey(evCheckDetailId);
        localStorage.setItem(storageKey, JSON.stringify(importedData));
        console.log("🔋 Saved battery data to localStorage");
      }
    } else {
      console.warn("🔋 No valid data in import response:", importedData);
    }
  };

  // ✅ Không hiển thị nếu là temp ID
  if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
    return null;
  }

  // ✅ Nếu chưa có dữ liệu, hiển thị nút Import
  if (!batteryData) {
    return (
      <div className="flex items-center gap-2">
        {canImport && (
          <Button
            type="primary"
            size="small"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setImportModalOpen(true)}
            style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
          >
            Import dữ liệu
          </Button>
        )}
        <BatteryImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          evCheckDetailId={evCheckDetailId}
          onSuccess={handleImportSuccess}
        />
      </div>
    );
  }

  // ✅ Nếu có dữ liệu, chỉ hiển thị nút "Xem chi tiết Pin" bên ngoài
  return (
    <>
      {/* ✅ Chỉ hiển thị nút bên ngoài */}
      <div className="flex items-center gap-2">
      
        <Button
          size="small"
          type="primary"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => navigate(`/technician/battery/${evCheckDetailId}`)}
          style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
        >
          Xem chi tiết Pin
        </Button>
      </div>

      {/* Modal Import */}
      <BatteryImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        evCheckDetailId={evCheckDetailId}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}
