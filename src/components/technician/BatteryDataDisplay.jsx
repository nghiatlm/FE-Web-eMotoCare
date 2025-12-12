import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Modal } from "antd";
import { 
  FileText,
  Upload
} from "lucide-react";
import BatteryImportModal from "./BatteryImportModal";
import BatteryDetailContent from "./BatteryDetailContent";
import { toast } from "react-toastify";
import { getBatteryDataService } from "../../services/batteryService";
export default function BatteryDataDisplay({ 
  evCheckDetailId, 
  canImport = true, 
  canView = true, 
  initialBatteryData = null,
  onViewDetail = null // ✅ Callback khi staff click "Chi tiết Pin"
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Xác định base path dựa vào current path
  const getBatteryPath = () => {
    if (location.pathname.startsWith("/staff")) {
      return `/staff/battery/${evCheckDetailId}`;
    } else if (location.pathname.startsWith("/technician")) {
      return `/technician/battery/${evCheckDetailId}`;
    }
    // Fallback: default to technician
    return `/technician/battery/${evCheckDetailId}`;
  };
  
  // ✅ Xác định có phải staff không
  const isStaff = location.pathname.startsWith("/staff");
  const [batteryData, setBatteryData] = useState(initialBatteryData || null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ✅ Lấy key để lưu vào localStorage
  const getStorageKey = (id) => `battery_data_${id}`;

  // ✅ Load dữ liệu từ initialBatteryData, localStorage, hoặc API (chỉ cho technician)
  useEffect(() => {
    if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
      return;
    }

    const loadBatteryData = async () => {
      // ✅ Ưu tiên 1: Sử dụng initialBatteryData (từ evCheckDetail) nếu có
      if (initialBatteryData && (initialBatteryData.id || initialBatteryData.sampleCount !== undefined)) {
        console.log("🔋 Loaded battery data from initialBatteryData (evCheckDetail):", initialBatteryData);
        setBatteryData(initialBatteryData);
        // ✅ Lưu vào localStorage để dùng lại sau
        const storageKey = getStorageKey(evCheckDetailId);
        localStorage.setItem(storageKey, JSON.stringify(initialBatteryData));
        return;
      }

      // ✅ Ưu tiên 2: Kiểm tra localStorage
      const storageKey = getStorageKey(evCheckDetailId);
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData && (parsedData.id || parsedData.sampleCount !== undefined)) {
            console.log("🔋 Loaded battery data from localStorage:", parsedData);
            setBatteryData(parsedData);
            return;
          }
        } catch (error) {
          console.error("🔋 Error parsing saved battery data:", error);
          localStorage.removeItem(storageKey);
        }
      }
      
      // ✅ Ưu tiên 3: Load từ API - Cho cả technician và staff (GET dữ liệu)
      // Chỉ khác nhau ở chỗ staff không thể import (POST), nhưng vẫn cần GET để xem
      try {
        const userType = canImport ? "Technician" : "Staff";
        console.log(`🔋 [${userType}] Loading battery data from API for evCheckDetailId:`, evCheckDetailId);
        const apiData = await getBatteryDataService(evCheckDetailId);
        if (apiData && (apiData.id || apiData.sampleCount !== undefined)) {
          console.log(`🔋 [${userType}] Loaded battery data from API:`, apiData);
          setBatteryData(apiData);
          // ✅ Lưu vào localStorage để dùng lại sau
          localStorage.setItem(storageKey, JSON.stringify(apiData));
          return;
        }
      } catch (error) {
        // ✅ Không log error nếu là 404 (không tìm thấy)
        if (error?.response?.status !== 404) {
          const userType = canImport ? "Technician" : "Staff";
          console.error(`🔋 [${userType}] Error loading battery data from API:`, error);
        }
      }
      
      // ✅ Nếu không có dữ liệu từ các nguồn trên, set về null
      setBatteryData(null);
    };

    loadBatteryData();
  }, [evCheckDetailId, initialBatteryData, canImport]);

  const handleImportSuccess = (importedData) => {
    // ✅ Lưu dữ liệu từ response import vào state
    if (importedData && (importedData.id || importedData.sampleCount !== undefined)) {
      console.log("🔋 Using imported data:", importedData);
      setBatteryData(importedData);
      
      // ✅ Lưu vào localStorage để load lại sau
      // ✅ Key: dùng evCheckDetailId làm key, value: lưu cả battery check ID và data
      if (evCheckDetailId && !evCheckDetailId.startsWith("temp_")) {
        const storageKey = getStorageKey(evCheckDetailId);
        const dataToStore = {
          ...importedData,
          batteryCheckId: importedData.id, // Lưu battery check ID để dùng sau
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        console.log("🔋 Saved battery data to localStorage with batteryCheckId:", importedData.id);
      }
    } else {
      console.warn("🔋 No valid data in import response:", importedData);
    }
  };

  // ✅ Không hiển thị nếu là temp ID
  if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
    return null;
  }

  // ✅ Nếu chưa có dữ liệu
  if (!batteryData) {
    // ✅ Nếu không cho phép import và không cho phép xem → không hiển thị gì
    if (!canImport && !canView) {
      return null;
    }
    
    return (
      <div style={{ width: "100%" }}>
        {canImport && (
          <Button
            type="primary"
            size="small"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setImportModalOpen(true)}
            style={{ 
              backgroundColor: "#ff4d4f", 
              borderColor: "#ff4d4f",
              width: "100%",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              fontSize: "12px"
            }}
          >
            Nhập dữ liệu
          </Button>
        )}
        {!canImport && canView && (
          <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded text-center">
            Chưa có dữ liệu pin
          </div>
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

  // ✅ Nếu có dữ liệu, hiển thị nút "Xem chi tiết Pin" (cho cả staff và technician)
  // ✅ Staff có thể xem nhưng không thể import
  if (!canView) {
    return null;
  }
  
  return (
    <>
      {/* ✅ Hiển thị nút xem chi tiết cho cả staff và technician */}
      <div style={{ width: "100%" }}>
        <Button
          size="small"
          type="primary"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => {
            // ✅ Staff: gọi callback để hiển thị trên page, Technician: navigate
            if (isStaff && onViewDetail) {
              onViewDetail(batteryData, evCheckDetailId);
            } else if (!isStaff) {
              navigate(getBatteryPath());
            }
          }}
          style={{ 
            backgroundColor: "#ff4d4f", 
            borderColor: "#ff4d4f",
            fontSize: "12px",
            width: "100%",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px"
          }}
        >
         Chi tiết Pin
        </Button>
      </div>

      {/* Modal Import - chỉ hiển thị nếu cho phép import */}
      {canImport && (
        <BatteryImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          evCheckDetailId={evCheckDetailId}
          onSuccess={handleImportSuccess}
        />
      )}
    </>
  );
}
