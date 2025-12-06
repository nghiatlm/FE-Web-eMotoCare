// src/pages/technician/BatteryDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Button,
  Divider,
  Alert,
  Typography,
  Space,
  Spin,
} from "antd";
import {
  Battery,
  TrendingUp,
  TrendingDown,
  Activity,
  Thermometer,
  Zap,
  FileText,
  AlertTriangle,
  Info,
  ArrowLeft,
} from "lucide-react";

import ReactECharts from "echarts-for-react";

const { Title, Paragraph } = Typography;

export default function BatteryDetailPage() {
  const { evCheckDetailId } = useParams();
  const navigate = useNavigate();
  const [batteryData, setBatteryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStorageKey = (id) => `battery_data_${id}`;

  useEffect(() => {
    if (!evCheckDetailId || evCheckDetailId.startsWith("temp_")) {
      setLoading(false);
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
      }
    }
    setLoading(false);
  }, [evCheckDetailId]);

  const getStatusColor = (conclusion) => {
    if (!conclusion) return "default";
    if (typeof conclusion === "object") {
      if (conclusion.safety && conclusion.safety.includes("quá nhiệt")) return "error";
      if (conclusion.safety && conclusion.safety.includes("cảnh báo")) return "warning";
      return "success";
    }
    if (typeof conclusion === "string") {
      if (
        conclusion.includes("tốt") ||
        conclusion.includes("an toàn") ||
        conclusion.includes("chấp nhận")
      ) {
        return "success";
      }
      if (conclusion.includes("cảnh báo") || conclusion.includes("chú ý")) {
        return "warning";
      }
    }
    return "error";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!batteryData) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <Alert
          message="Không tìm thấy dữ liệu pin"
          description="Vui lòng import dữ liệu pin trước khi xem chi tiết."
          type="warning"
          showIcon
        />
      </div>
    );
  }

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

  // ====== Helper format data cho chart ======
  const voltageCurrentData = [
    {
      name: "Min",
      voltage: minVoltage || 0,
      current: minCurrent || 0,
    },
    {
      name: "Trung bình",
      voltage: avgVoltage || 0,
      current: avgCurrent || 0,
    },
    {
      name: "Max",
      voltage: maxVoltage || 0,
      current: maxCurrent || 0,
    },
  ];

  const tempData = [
    { name: "Min", value: minTemp || 0 },
    { name: "Trung bình", value: avgTemp || 0 },
    { name: "Max", value: maxTemp || 0 },
  ];

  const socSohData = [
    {
      name: "Min",
      soc: minSOC || 0,
      soh: minSOH || 0,
    },
    {
      name: "Trung bình",
      soc: avgSOC || 0,
      soh: avgSOH || 0,
    },
    {
      name: "Max",
      soc: maxSOC || 0,
      soh: maxSOH || 0,
    },
  ];

  // ====== ECharts options ======

  const getVoltageCurrentOption = () => ({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#ffffff",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      textStyle: { color: "#595959", fontSize: 11 },
    },
    legend: {
      data: ["Điện áp (V)", "Dòng điện (A)"],
      top: 5,
      textStyle: { fontSize: 10, color: "#595959" },
    },
    grid: { top: 35, left: 35, right: 20, bottom: 25 },
    xAxis: [
      {
        type: "category",
        data: voltageCurrentData.map((d) => d.name),
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: "#d9d9d9" } },
        axisLabel: { fontSize: 10 },
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "V",
        position: "left",
        nameTextStyle: { fontSize: 10 },
        axisLine: { lineStyle: { color: "#1890ff" } },
        splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } },
        axisLabel: { fontSize: 9 },
      },
      {
        type: "value",
        name: "A",
        position: "right",
        nameTextStyle: { fontSize: 10 },
        axisLine: { lineStyle: { color: "#52c41a" } },
        splitLine: { show: false },
        axisLabel: { fontSize: 9 },
      },
    ],
    series: [
      {
        name: "Điện áp (V)",
        type: "bar",
        yAxisIndex: 0,
        data: voltageCurrentData.map((d) => d.voltage),
        barWidth: 18,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#1890ff",
        },
      },
      {
        name: "Dòng điện (A)",
        type: "bar",
        yAxisIndex: 1,
        data: voltageCurrentData.map((d) => d.current),
        barWidth: 18,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#52c41a",
        },
      },
    ],
  });

  const getTempOption = () => ({
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      textStyle: { color: "#595959", fontSize: 11 },
    },
    grid: { top: 25, left: 35, right: 20, bottom: 25 },
    xAxis: {
      type: "category",
      data: tempData.map((d) => d.name),
      axisLine: { lineStyle: { color: "#d9d9d9" } },
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "°C",
      nameTextStyle: { fontSize: 10 },
      axisLine: { lineStyle: { color: "#fa8c16" } },
      splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } },
      axisLabel: { fontSize: 9 },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: tempData.map((d) => d.value),
        lineStyle: {
          width: 2.5,
          color: "#fa8c16",
        },
        itemStyle: {
          color: "#fa8c16",
          borderWidth: 2,
          borderColor: "#fff",
        },
        areaStyle: {
          opacity: 0.3,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(250,140,22,0.4)" },
              { offset: 1, color: "rgba(250,140,22,0)" },
            ],
          },
        },
      },
    ],
  });

  const getSocSohOption = () => ({
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      textStyle: { color: "#595959", fontSize: 11 },
    },
    legend: {
      data: ["SOC (%)", "SOH (%)"],
      top: 5,
      textStyle: { fontSize: 10, color: "#595959" },
    },
    grid: { top: 35, left: 35, right: 20, bottom: 25 },
    xAxis: {
      type: "category",
      data: socSohData.map((d) => d.name),
      axisLine: { lineStyle: { color: "#d9d9d9" } },
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 110,
      nameTextStyle: { fontSize: 10 },
      axisLine: { lineStyle: { color: "#bfbfbf" } },
      splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } },
      axisLabel: { fontSize: 9 },
    },
    series: [
      {
        name: "SOC (%)",
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: socSohData.map((d) => d.soc),
        lineStyle: { width: 2.5, color: "#722ed1" },
        itemStyle: {
          color: "#722ed1",
          borderWidth: 2,
          borderColor: "#fff",
        },
        areaStyle: {
          opacity: 0.2,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(114,46,209,0.3)" },
              { offset: 1, color: "rgba(114,46,209,0)" },
            ],
          },
        },
      },
      {
        name: "SOH (%)",
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: socSohData.map((d) => d.soh),
        lineStyle: { width: 2.5, color: "#eb2f96" },
        itemStyle: {
          color: "#eb2f96",
          borderWidth: 2,
          borderColor: "#fff",
        },
        areaStyle: {
          opacity: 0.15,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(235,47,150,0.25)" },
              { offset: 1, color: "rgba(235,47,150,0)" },
            ],
          },
        },
      },
    ],
  });

  return (
    <div className="p-6" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <Title level={2} style={{ margin: 0, color: "#ff4d4f" }}>
              Chi tiết dữ liệu Pin
            </Title>
          </div>
        </div>
        <Tag color={getStatusColor(conclusion)}>{sampleCount} mẫu</Tag>
      </div>

      <div className="space-y-6">
        {/* Tóm tắt nhanh */}
        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>
            Tóm tắt nhanh
          </h4>
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
          <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>
            Biểu đồ dữ liệu Pin
          </h4>

          {/* 3 biểu đồ trên 1 hàng */}
          <Row gutter={[16, 16]}>
            {/* Voltage + Current */}
            <Col span={8}>
              <Card title="Điện áp - Dòng điện" size="small">
                <ReactECharts
                  option={getVoltageCurrentOption()}
                  style={{ width: "100%", height: 200 }}
                  notMerge
                  lazyUpdate
                />
              </Card>
            </Col>

            {/* Temperature */}
            <Col span={8}>
              <Card title="Nhiệt độ" size="small">
                <ReactECharts
                  option={getTempOption()}
                  style={{ width: "100%", height: 200 }}
                  notMerge
                  lazyUpdate
                />
              </Card>
            </Col>

            {/* SOC & SOH */}
            <Col span={8}>
              <Card title="SOC - SOH" size="small">
                <ReactECharts
                  option={getSocSohOption()}
                  style={{ width: "100%", height: 200 }}
                  notMerge
                  lazyUpdate
                />
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
                        <td className="text-right p-2 text-red-600">
                          {minVoltage?.toFixed(2)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {avgVoltage?.toFixed(2)}
                        </td>
                        <td className="text-right p-2 text-green-600">
                          {maxVoltage?.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Dòng điện (A)</td>
                        <td className="text-right p-2 text-red-600">
                          {minCurrent?.toFixed(2)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {avgCurrent?.toFixed(2)}
                        </td>
                        <td className="text-right p-2 text-green-600">
                          {maxCurrent?.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Nhiệt độ (°C)</td>
                        <td className="text-right p-2 text-blue-600">
                          {minTemp?.toFixed(1)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {avgTemp?.toFixed(1)}
                        </td>
                        <td className="text-right p-2 text-orange-600">
                          {maxTemp?.toFixed(1)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">SOC (%)</td>
                        <td className="text-right p-2 text-red-600">{minSOC}</td>
                        <td className="text-right p-2 font-semibold">
                          {avgSOC?.toFixed(1)}
                        </td>
                        <td className="text-right p-2 text-green-600">{maxSOC}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">SOH (%)</td>
                        <td className="text-right p-2 text-red-600">{minSOH}</td>
                        <td className="text-right p-2 font-semibold">
                          {avgSOH?.toFixed(1)}
                        </td>
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

        {/* Kết luận */}
        {conclusion && (
          <div className="mt-6">
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
                <FileText className="h-5 w-5 inline mr-2" />
                Kết luận đánh giá Pin
              </Title>
            </Divider>

            <div className="space-y-6">
                {(() => {
                  let conclusionObj = null;

                  console.log("🔍 Conclusion type:", typeof conclusion);
                  console.log("🔍 Conclusion value:", conclusion);

                  if (typeof conclusion === "string") {
                    try {
                      // ✅ Thử parse toàn bộ string trước
                      const parsed = JSON.parse(conclusion);
                      console.log("🔍 Parsed conclusion:", parsed);
                      if (
                        typeof parsed === "object" &&
                        parsed !== null &&
                        !Array.isArray(parsed)
                      ) {
                        conclusionObj = parsed;
                      } else if (Array.isArray(parsed)) {
                        // ✅ Nếu là array, merge các objects lại
                        conclusionObj = parsed.reduce((acc, item) => ({ ...acc, ...item }), {});
                      }
                    } catch (e) {
                      console.log("🔍 Failed to parse as single JSON, trying to parse multiple JSON objects...");
                      // ✅ Nếu parse toàn bộ thất bại, thử parse từng JSON object riêng biệt
                      try {
                        // ✅ Tìm tất cả các JSON objects trong string (có thể có nhiều objects)
                        // Sử dụng regex để tìm các JSON objects (cân bằng ngoặc nhọn)
                        const jsonMatches = [];
                        let depth = 0;
                        let start = -1;
                        let inString = false;
                        let escapeNext = false;
                        
                        for (let i = 0; i < conclusion.length; i++) {
                          const char = conclusion[i];
                          
                          if (escapeNext) {
                            escapeNext = false;
                            continue;
                          }
                          
                          if (char === '\\') {
                            escapeNext = true;
                            continue;
                          }
                          
                          if (char === '"' && !escapeNext) {
                            inString = !inString;
                            continue;
                          }
                          
                          if (!inString) {
                            if (char === '{') {
                              if (depth === 0) start = i;
                              depth++;
                            } else if (char === '}') {
                              depth--;
                              if (depth === 0 && start !== -1) {
                                const match = conclusion.substring(start, i + 1);
                                jsonMatches.push(match);
                                start = -1;
                              }
                            }
                          }
                        }
                        
                        console.log("🔍 Found JSON matches:", jsonMatches.length);
                        console.log("🔍 JSON matches:", jsonMatches);
                        
                        if (jsonMatches && jsonMatches.length > 0) {
                          conclusionObj = {};
                          jsonMatches.forEach((match, idx) => {
                            try {
                              const parsed = JSON.parse(match.trim());
                              console.log(`🔍 Parsed JSON match ${idx}:`, parsed);
                              if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                                // ✅ Merge các keys vào conclusionObj
                                Object.keys(parsed).forEach(key => {
                                  conclusionObj[key] = parsed[key];
                                });
                              }
                            } catch (err) {
                              console.warn(`Failed to parse JSON match ${idx}:`, err);
                              console.warn(`Match content:`, match.substring(0, 100));
                            }
                          });
                          console.log("🔍 Final merged conclusionObj:", conclusionObj);
                        }
                      } catch (e2) {
                        console.error("Failed to parse conclusion:", e2);
                      conclusionObj = null;
                      }
                    }
                  } else if (
                    typeof conclusion === "object" &&
                    conclusion !== null &&
                    !Array.isArray(conclusion)
                  ) {
                    conclusionObj = conclusion;
                  } else if (Array.isArray(conclusion)) {
                    // ✅ Nếu là array, merge các objects lại
                    conclusionObj = conclusion.reduce((acc, item) => ({ ...acc, ...item }), {});
                  }

                  // ✅ Hiển thị UI mới nếu có bất kỳ dữ liệu nào trong conclusionObj
                  if (conclusionObj && Object.keys(conclusionObj).length > 0) {
                    const sections = [
                      {
                        key: "energyCapability",
                        title: "Khả năng cung cấp năng lượng",
                        icon: <Zap className="h-5 w-5" />,
                        color: "#52c41a",
                        bgColor: "#f6ffed",
                        borderColor: "#b7eb8f",
                        borderLeft: "5px solid #52c41a",
                      },
                      {
                        key: "chargeDischargeEfficiency",
                        title: "Hiệu suất nạp/xả",
                        icon: <Activity className="h-5 w-5" />,
                        color: "#1890ff",
                        bgColor: "#f0f5ff",
                        borderColor: "#adc6ff",
                        borderLeft: "5px solid #1890ff",
                      },
                      {
                        key: "degradationStatus",
                        title: "Tình trạng xuống cấp",
                        icon: <TrendingDown className="h-5 w-5" />,
                        color: "#faad14",
                        bgColor: "#fffbe6",
                        borderColor: "#ffe58f",
                        borderLeft: "5px solid #faad14",
                      },
                      {
                        key: "remainingUsefulLife",
                        title: "Tuổi thọ còn lại",
                        icon: <TrendingUp className="h-5 w-5" />,
                        color: "#722ed1",
                        bgColor: "#f9f0ff",
                        borderColor: "#d3adf7",
                        borderLeft: "5px solid #722ed1",
                      },
                      {
                        key: "safety",
                        title: "An toàn",
                        icon: <AlertTriangle className="h-5 w-5" />,
                        color: "#ff4d4f",
                        bgColor: "#fff1f0",
                        borderColor: "#ffccc7",
                        borderLeft: "5px solid #ff4d4f",
                      },
                    ];

                    // ✅ Hiển thị solution riêng biệt và nổi bật hơn (key mới trong cấu trúc mới)
                    const hasSolution = conclusionObj.solution || conclusionObj.conclusion;

                    return (
                      <div className="space-y-6">
                        {/* ✅ Các section phân tích - Layout 3-2 (3 trên, 2 dưới) */}
                        <div>
                          {/* Hàng đầu: 3 cards */}
                          <Row gutter={[20, 20]} justify="start">
                            {sections.slice(0, 3).map((section) => {
                          const content = conclusionObj[section.key];
                          if (!content) return null;

                          return (
                                <Col xs={24} sm={24} md={8} key={section.key}>
                            <Card
                              size="small"
                              style={{
                                backgroundColor: section.bgColor,
                                border: `1px solid ${section.borderColor}`,
                                      borderLeft: section.borderLeft,
                                      borderRadius: "10px",
                                      height: "100%",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                      transition: "all 0.3s ease",
                                    }}
                                    bodyStyle={{ padding: "20px" }}
                                    hoverable
                                  >
                                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                      <div className="flex items-center gap-3" style={{ marginBottom: "4px" }}>
                                        <div 
                                          style={{ 
                                            color: section.color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "8px",
                                            backgroundColor: `${section.color}15`,
                                          }}
                                        >
                                  {section.icon}
                                        </div>
                                        <Title 
                                          level={5} 
                                          style={{ 
                                            margin: 0, 
                                            color: section.color,
                                            fontWeight: 600,
                                            fontSize: "16px",
                                            lineHeight: "1.5",
                                          }}
                                        >
                                    {section.title}
                                  </Title>
                                </div>
                                <Paragraph
                                  className="mb-0"
                                  style={{
                                    whiteSpace: "pre-wrap",
                                          lineHeight: 1.75,
                                          color: "#262626",
                                    fontSize: "14px",
                                          margin: 0,
                                          textAlign: "justify",
                                  }}
                                >
                                  {content}
                                </Paragraph>
                              </Space>
                            </Card>
                                </Col>
                          );
                        })}
                          </Row>
                          
                          {/* Hàng dưới: 2 cards - tổng chiều rộng bằng 3 cards trên */}
                          {sections.slice(3).length > 0 && (
                            <Row gutter={[20, 20]} justify="start" style={{ marginTop: 20 }}>
                              {sections.slice(3).map((section) => {
                                const content = conclusionObj[section.key];
                                if (!content) return null;

                                return (
                                  <Col 
                                    xs={24} 
                                    sm={24} 
                                    md={12}
                                    key={section.key}
                                  >
                                    <Card
                                      size="small"
                                      style={{
                                        backgroundColor: section.bgColor,
                                        border: `1px solid ${section.borderColor}`,
                                        borderLeft: section.borderLeft,
                                        borderRadius: "10px",
                                        height: "100%",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        transition: "all 0.3s ease",
                                      }}
                                      bodyStyle={{ padding: "20px" }}
                                      hoverable
                                    >
                                      <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                        <div className="flex items-center gap-3" style={{ marginBottom: "4px" }}>
                                          <div 
                                            style={{ 
                                              color: section.color,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              width: "32px",
                                              height: "32px",
                                              borderRadius: "8px",
                                              backgroundColor: `${section.color}15`,
                                            }}
                                          >
                                            {section.icon}
                                          </div>
                                          <Title 
                                            level={5} 
                                            style={{ 
                                              margin: 0, 
                                              color: section.color,
                                              fontWeight: 600,
                                              fontSize: "16px",
                                              lineHeight: "1.5",
                                            }}
                                          >
                                            {section.title}
                                          </Title>
                                        </div>
                                        <Paragraph
                                          className="mb-0"
                                          style={{
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.75,
                                            color: "#262626",
                                            fontSize: "14px",
                                            margin: 0,
                                            textAlign: "justify",
                                          }}
                                        >
                                          {content}
                                        </Paragraph>
                                      </Space>
                                    </Card>
                                  </Col>
                                );
                              })}
                            </Row>
                          )}
                        </div>

                        {/* ✅ Kết luận cuối cùng - nổi bật và chiếm full width */}
                        {hasSolution && (
                          <Card
                            style={{
                              backgroundColor: (conclusionObj.solution || conclusionObj.conclusion || "").includes("Bảo Hành") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("Thay Thế")
                                ? "#fff1f0"
                                : (conclusionObj.solution || conclusionObj.conclusion || "").includes("tốt") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("bình thường")
                                ? "#f6ffed"
                                : "#fffbe6",
                              border: (conclusionObj.solution || conclusionObj.conclusion || "").includes("Bảo Hành") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("Thay Thế")
                                ? "2px solid #ff4d4f"
                                : (conclusionObj.solution || conclusionObj.conclusion || "").includes("tốt") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("bình thường")
                                ? "2px solid #52c41a"
                                : "2px solid #faad14",
                              borderRadius: "12px",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                              marginTop: "8px",
                            }}
                            bodyStyle={{ padding: "28px" }}
                          >
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                              <div className="flex items-center gap-3">
                                <div
                                  style={{
                                    color: (conclusionObj.solution || conclusionObj.conclusion || "").includes("Bảo Hành") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("Thay Thế")
                                      ? "#ff4d4f"
                                      : (conclusionObj.solution || conclusionObj.conclusion || "").includes("tốt") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("bình thường")
                                      ? "#52c41a"
                                      : "#faad14",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    backgroundColor: (conclusionObj.solution || conclusionObj.conclusion || "").includes("Bảo Hành") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("Thay Thế")
                                      ? "#ff4d4f20"
                                      : (conclusionObj.solution || conclusionObj.conclusion || "").includes("tốt") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("bình thường")
                                      ? "#52c41a20"
                                      : "#faad1420",
                                  }}
                                >
                                  <FileText className="h-5 w-5" />
                                </div>
                                <Title 
                                  level={4} 
                                  style={{ 
                                    margin: 0,
                                    color: (conclusionObj.solution || conclusionObj.conclusion || "").includes("Bảo Hành") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("Thay Thế")
                                      ? "#ff4d4f"
                                      : (conclusionObj.solution || conclusionObj.conclusion || "").includes("tốt") || (conclusionObj.solution || conclusionObj.conclusion || "").includes("bình thường")
                                      ? "#52c41a"
                                      : "#faad14",
                                    fontWeight: 700,
                                    fontSize: "18px",
                                  }}
                                >
                                  Giải pháp
                                </Title>
                              </div>
                              <div
                                style={{
                                  whiteSpace: "pre-wrap",
                                  lineHeight: 1.85,
                                  color: "#262626",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                  marginTop: "4px",
                                  textAlign: "justify",
                                }}
                              >
                                {(conclusionObj.solution || conclusionObj.conclusion || "").split(/(\*\*.*?\*\*)/g).map((part, index) => {
                                  if (part.startsWith("**") && part.endsWith("**")) {
                                    const text = part.replace(/\*\*/g, "");
                                    return (
                                      <span key={index} style={{ color: "#ff4d4f", fontWeight: 700 }}>
                                        {text}
                                      </span>
                                    );
                                  }
                                  return <span key={index}>{part}</span>;
                                })}
                              </div>
                            </Space>
                          </Card>
                        )}
                      </div>
                    );
                  }

                  // ✅ Nếu không parse được, vẫn thử hiển thị UI mới với dữ liệu thô
                  // Hoặc hiển thị thông báo lỗi parse
                  return (
                    <Card
                      style={{
                        backgroundColor: "#f0f5ff",
                        border: "1px solid #adc6ff",
                        borderRadius: "8px",
                      }}
                      bodyStyle={{ padding: "16px" }}
                    >
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" style={{ color: "#1890ff" }} />
                          <Title level={5} style={{ margin: 0, color: "#1890ff" }}>
                            Kết luận
                          </Title>
                        </div>
                        <Paragraph
                          className="mb-0"
                          style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.8,
                            color: "#262626",
                            fontSize: "14px",
                          }}
                        >
                          {typeof conclusion === "string" ? conclusion : JSON.stringify(conclusion, null, 2)}
                        </Paragraph>
                      </Space>
                    </Card>
                  );
                })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
