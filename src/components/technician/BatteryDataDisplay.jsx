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
  onViewDetail = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  

  const getBatteryPath = () => {
    if (location.pathname.startsWith("/staff")) {
      return `/staff/battery/${evCheckDetailId}`;
    } else if (location.pathname.startsWith("/technician")) {
      return `/technician/battery/${evCheckDetailId}`;
    }

    return `/technician/battery/${evCheckDetailId}`;
  };
  

  const isStaff = location.pathname.startsWith("/staff");
  const [batteryData, setBatteryData] = useState(initialBatteryData || null);
  const [importModalOpen, setImportModalOpen] = useState(false);


  const getStorageKey = (id) => `battery_data_${id}`;


  useEffect(() => {
    if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
      return;
    }

    const loadBatteryData = async () => {

      if (initialBatteryData && (initialBatteryData.id || initialBatteryData.sampleCount !== undefined)) {
        setBatteryData(initialBatteryData);

        const storageKey = getStorageKey(evCheckDetailId);
        localStorage.setItem(storageKey, JSON.stringify(initialBatteryData));
        return;
      }


      const storageKey = getStorageKey(evCheckDetailId);
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData && (parsedData.id || parsedData.sampleCount !== undefined)) {
            setBatteryData(parsedData);
            return;
          }
        } catch (error) {
          localStorage.removeItem(storageKey);
        }
      }
      


      try {
        const userType = canImport ? "Technician" : "Staff";
        const apiData = await getBatteryDataService(evCheckDetailId);
        if (apiData && (apiData.id || apiData.sampleCount !== undefined)) {
          setBatteryData(apiData);

          localStorage.setItem(storageKey, JSON.stringify(apiData));
          return;
        }
      } catch (error) {

        if (error?.response?.status !== 404) {
          const userType = canImport ? "Technician" : "Staff";
        }
      }
      

      setBatteryData(null);
    };

    loadBatteryData();
  }, [evCheckDetailId, initialBatteryData, canImport]);

  const handleImportSuccess = (importedData) => {

    if (importedData && (importedData.id || importedData.sampleCount !== undefined)) {
      setBatteryData(importedData);
      


      if (evCheckDetailId && !evCheckDetailId.startsWith("temp_")) {
        const storageKey = getStorageKey(evCheckDetailId);
        const dataToStore = {
          ...importedData,
          batteryCheckId: importedData.id,
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      }
    } else {
    }
  };


  if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
    return null;
  }


  if (!batteryData) {

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



  if (!canView) {
    return null;
  }
  
  return (
    <>
      
      <div style={{ width: "100%" }}>
        <Button
          size="small"
          type="primary"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => {

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
