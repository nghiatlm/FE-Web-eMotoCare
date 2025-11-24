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
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
        width={1200}
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

          {/* Biểu đồ dữ liệu */}
          <div className="space-y-6">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>Biểu đồ dữ liệu Pin</h4>
            
            {/* Biểu đồ Điện áp và Dòng điện */}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Điện áp (Voltage) - Dòng điện (Current)" size="small">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        {
                          name: "Min",
                          "Điện áp (V)": minVoltage || 0,
                          "Dòng điện (A)": minCurrent || 0,
                        },
                        {
                          name: "Trung bình",
                          "Điện áp (V)": avgVoltage || 0,
                          "Dòng điện (A)": avgCurrent || 0,
                        },
                        {
                          name: "Max",
                          "Điện áp (V)": maxVoltage || 0,
                          "Dòng điện (A)": maxCurrent || 0,
                        },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#1890ff" />
                      <YAxis yAxisId="right" orientation="right" stroke="#52c41a" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Điện áp (V)" fill="#1890ff" />
                      <Bar yAxisId="right" dataKey="Dòng điện (A)" fill="#52c41a" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Biểu đồ Nhiệt độ */}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Nhiệt độ (Temperature)" size="small">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={[
                        { name: "Min", value: minTemp || 0 },
                        { name: "Trung bình", value: avgTemp || 0 },
                        { name: "Max", value: maxTemp || 0 },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fa8c16" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#fa8c16" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#fa8c16"
                        fillOpacity={1}
                        fill="url(#colorTemp)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Biểu đồ SOC và SOH */}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="SOC (State of Charge) - SOH (State of Health)" size="small">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={[
                        {
                          name: "Min",
                          "SOC (%)": minSOC || 0,
                          "SOH (%)": minSOH || 0,
                        },
                        {
                          name: "Trung bình",
                          "SOC (%)": avgSOC || 0,
                          "SOH (%)": avgSOH || 0,
                        },
                        {
                          name: "Max",
                          "SOC (%)": maxSOC || 0,
                          "SOH (%)": maxSOH || 0,
                        },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="SOC (%)"
                        stroke="#722ed1"
                        strokeWidth={2}
                        dot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="SOH (%)"
                        stroke="#eb2f96"
                        strokeWidth={2}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Bảng tóm tắt số liệu */}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="Bảng tóm tắt số liệu" size="small">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Chỉ số</th>
                          <th className="text-right p-2">Min</th>
                          <th className="text-right p-2">Trung bình</th>
                          <th className="text-right p-2">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Điện áp (V)</td>
                          <td className="text-right p-2 text-red-600">{minVoltage?.toFixed(2)}</td>
                          <td className="text-right p-2 font-semibold">{avgVoltage?.toFixed(2)}</td>
                          <td className="text-right p-2 text-green-600">{maxVoltage?.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Dòng điện (A)</td>
                          <td className="text-right p-2 text-red-600">{minCurrent?.toFixed(2)}</td>
                          <td className="text-right p-2 font-semibold">{avgCurrent?.toFixed(2)}</td>
                          <td className="text-right p-2 text-green-600">{maxCurrent?.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Nhiệt độ (°C)</td>
                          <td className="text-right p-2 text-blue-600">{minTemp?.toFixed(1)}</td>
                          <td className="text-right p-2 font-semibold">{avgTemp?.toFixed(1)}</td>
                          <td className="text-right p-2 text-orange-600">{maxTemp?.toFixed(1)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">SOC (%)</td>
                          <td className="text-right p-2 text-red-600">{minSOC}</td>
                          <td className="text-right p-2 font-semibold">{avgSOC?.toFixed(1)}</td>
                          <td className="text-right p-2 text-green-600">{maxSOC}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">SOH (%)</td>
                          <td className="text-right p-2 text-red-600">{minSOH}</td>
                          <td className="text-right p-2 font-semibold">{avgSOH?.toFixed(1)}</td>
                          <td className="text-right p-2 text-green-600">{maxSOH}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <strong>Số mẫu:</strong> {sampleCount}
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

