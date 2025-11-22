import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Tag, Button, Modal, Divider } from "antd";
import { 
  Battery, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Thermometer,
  Zap,
  FileText,
  Upload
} from "lucide-react";
import BatteryImportModal from "./BatteryImportModal";
import { toast } from "@/components/ui/sonner";

export default function BatteryDataDisplay({ evCheckDetailId, canImport = true }) {
  const [batteryData, setBatteryData] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

  // ✅ Xác định trạng thái dựa trên kết luận (nếu có dữ liệu)
  const getStatusColor = (conclusion) => {
    if (!conclusion) return "default";
    if (conclusion.includes("tốt") || conclusion.includes("an toàn") || conclusion.includes("chấp nhận")) {
      return "success";
    }
    if (conclusion.includes("cảnh báo") || conclusion.includes("chú ý")) {
      return "warning";
    }
    return "error";
  };

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
  const {
    sampleCount,
    minVoltage,
    maxVoltage,
    avgVoltage,
    minCurrent,
    maxCurrent,
    avgCurrent,
    minTemp,
    maxTemp,
    avgTemp,
    minSOC,
    maxSOC,
    avgSOC,
    minSOH,
    maxSOH,
    avgSOH,
    conclusion,
  } = batteryData;

  return (
    <>
      {/* ✅ Chỉ hiển thị nút bên ngoài */}
      <div className="flex items-center gap-2">
      
        <Button
          size="small"
          type="primary"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => setDetailModalOpen(true)}
          style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
        >
          Xem chi tiết Pin
        </Button>
      </div>

      {/* Modal chi tiết */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Battery className="h-5 w-5" style={{ color: "#ff4d4f" }} />
            <span>Chi tiết dữ liệu Pin</span>
            <Tag color={getStatusColor(conclusion)} style={{ marginLeft: "auto" }}>
              {sampleCount} mẫu
            </Tag>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
      >
        <div className="space-y-4">
          {/* Tóm tắt nhanh */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>Tóm tắt nhanh</h4>
            <Row gutter={[8, 8]}>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Điện áp (V)"
                    value={avgVoltage?.toFixed(2)}
                    prefix={<Zap className="h-3 w-3" />}
                    valueStyle={{ fontSize: "14px", color: "#1890ff" }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {minVoltage?.toFixed(1)} - {maxVoltage?.toFixed(1)}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Dòng điện (A)"
                    value={avgCurrent?.toFixed(2)}
                    prefix={<Activity className="h-3 w-3" />}
                    valueStyle={{ fontSize: "14px", color: "#52c41a" }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {minCurrent?.toFixed(1)} - {maxCurrent?.toFixed(1)}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Nhiệt độ (°C)"
                    value={avgTemp?.toFixed(1)}
                    prefix={<Thermometer className="h-3 w-3" />}
                    valueStyle={{ fontSize: "14px", color: "#fa8c16" }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {minTemp?.toFixed(1)} - {maxTemp?.toFixed(1)}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="SOC (%)"
                    value={avgSOC?.toFixed(1)}
                    prefix={<TrendingUp className="h-3 w-3" />}
                    valueStyle={{ fontSize: "14px", color: "#722ed1" }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {minSOC} - {maxSOC}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Chi tiết đầy đủ */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>Chi tiết đầy đủ</h4>
            <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Điện áp (Voltage)" size="small">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trung bình:</span>
                    <strong>{avgVoltage?.toFixed(2)} V</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span className="text-red-600">{minVoltage?.toFixed(2)} V</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span className="text-green-600">{maxVoltage?.toFixed(2)} V</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Dòng điện (Current)" size="small">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trung bình:</span>
                    <strong>{avgCurrent?.toFixed(2)} A</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span className="text-red-600">{minCurrent?.toFixed(2)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span className="text-green-600">{maxCurrent?.toFixed(2)} A</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Nhiệt độ (Temperature)" size="small">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trung bình:</span>
                    <strong>{avgTemp?.toFixed(1)} °C</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span className="text-blue-600">{minTemp?.toFixed(1)} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span className="text-orange-600">{maxTemp?.toFixed(1)} °C</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="SOC (State of Charge)" size="small">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trung bình:</span>
                    <strong>{avgSOC?.toFixed(1)} %</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span className="text-red-600">{minSOC} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span className="text-green-600">{maxSOC} %</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="SOH (State of Health)" size="small">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trung bình:</span>
                    <strong>{avgSOH?.toFixed(1)} %</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span className="text-red-600">{minSOH} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span className="text-green-600">{maxSOH} %</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Thông tin mẫu" size="small">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Số mẫu:</span>
                    <strong>{sampleCount}</strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
          </div>

          {conclusion && (
            <Card title="Kết luận" size="small" className="bg-blue-50">
              <p className="text-sm">{conclusion}</p>
            </Card>
          )}
        </div>
      </Modal>

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

