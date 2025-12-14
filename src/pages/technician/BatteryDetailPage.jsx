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
import BatteryDetailContent from "../../components/technician/BatteryDetailContent";

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
          setBatteryData(parsedData);
        }
      } catch (error) {
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
    time = [],
    voltage = [],
    current: currentFromData = [],
    power = [],
    temp = [],
    soc = [],
    soh = [],
    sampleCount = 0,
    conclusion = {},
  } = batteryData;

  const currentArray = (power && power.length > 0) ? power : (currentFromData && currentFromData.length > 0 ? currentFromData : []);

  const calculateStats = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return { min: 0, max: 0, avg: 0 };
    const validValues = arr.filter(v => v !== null && v !== undefined && !isNaN(v)).map(v => Number(v));
    if (validValues.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const avg = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    return { min, max, avg };
  };

  const voltageStats = calculateStats(voltage);
  const currentStats = calculateStats(currentArray);
  const tempStats = calculateStats(temp);
  const socStats = calculateStats(soc);
  const sohStats = calculateStats(soh);

  const getVoltageCurrentOption = () => ({
    title: {
      text: "V",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    legend: {
      data: ["Điện áp (V)", "Dòng điện (A)"],
      bottom: 8,
      textStyle: { fontSize: 11 },
      itemGap: 20,
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "15%",
      bottom: "25%",
    },
    xAxis: {
      type: "value",
      name: "Thời gian (s)",
      nameLocation: "middle",
      nameGap: 35,
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 9 },
    },
    yAxis: [
      {
        type: "value",
        name: "Điện áp (V)",
        position: "left",
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 9 },
      },
      {
        type: "value",
        name: "Dòng điện (A)",
        position: "right",
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 9 },
      },
    ],
    series: [
      {
        name: "Điện áp (V)",
        type: "line",
        smooth: true,
        symbolSize: 4,
        data: time.map((t, idx) => [t, voltage[idx] || 0]),
        lineStyle: { width: 2, color: "#5470c6" },
        itemStyle: { color: "#5470c6" },
        yAxisIndex: 0,
      },
      {
        name: "Dòng điện (A)",
        type: "line",
        smooth: true,
        symbolSize: 4,
        data: time.map((t, idx) => [t, currentArray[idx] || 0]),
        lineStyle: { width: 2, color: "#91cc75" },
        itemStyle: { color: "#91cc75" },
        yAxisIndex: 1,
      },
    ],
  });

  const getTempOption = () => ({
    title: {
      text: "°C",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "15%",
      bottom: "18%",
    },
    xAxis: {
      type: "value",
      name: "Thời gian (s)",
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 9 },
    },
    yAxis: {
      type: "value",
      name: "Nhiệt độ (°C)",
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 9 },
    },
    series: [
      {
        name: "Nhiệt độ",
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: time.map((t, idx) => [t, temp[idx] || 0]),
        lineStyle: { width: 2.5, color: "#fac858" },
        itemStyle: { color: "#fac858", borderWidth: 2, borderColor: "#fff" },
        areaStyle: {
          opacity: 0.2,
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(250,200,88,0.3)" },
              { offset: 1, color: "rgba(250,200,88,0)" },
            ],
          },
        },
      },
    ],
  });

  const getSocSohOption = () => ({
    title: {
      text: "SOC & SOH",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    legend: {
      data: ["SOC (%)", "SOH (%)"],
      bottom: 8,
      textStyle: { fontSize: 11 },
      itemGap: 20,
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "15%",
      bottom: "25%",
    },
    xAxis: {
      type: "value",
      name: "Thời gian (s)",
      nameLocation: "middle",
      nameGap: 35,
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 9 },
    },
    yAxis: {
      type: "value",
      name: "Phần trăm (%)",
      min: 0,
      max: 110,
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 9 },
    },
    series: [
      {
        name: "SOC (%)",
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: time.map((t, idx) => [t, soc[idx] || 0]),
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
            x: 0, y: 0, x2: 0, y2: 1,
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
        data: time.map((t, idx) => [t, soh[idx] || 0]),
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
            x: 0, y: 0, x2: 0, y2: 1,
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
        
        <div>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>
            Tóm tắt nhanh
          </h4>
          <Row gutter={[8, 8]}>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Điện áp (V)"
                  value={voltageStats.avg.toFixed(2)}
                  prefix={<Zap className="h-3 w-3" />}
                  valueStyle={{ fontSize: "14px", color: "#1890ff" }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {voltageStats.min.toFixed(1)} - {voltageStats.max.toFixed(1)}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Dòng điện (A)"
                  value={currentStats.avg.toFixed(2)}
                  prefix={<Activity className="h-3 w-3" />}
                  valueStyle={{ fontSize: "14px", color: "#52c41a" }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {currentStats.min.toFixed(1)} - {currentStats.max.toFixed(1)}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="Nhiệt độ (°C)"
                  value={tempStats.avg.toFixed(1)}
                  prefix={<Thermometer className="h-3 w-3" />}
                  valueStyle={{ fontSize: "14px", color: "#fa8c16" }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {tempStats.min.toFixed(1)} - {tempStats.max.toFixed(1)}
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="text-center">
                <Statistic
                  title="SOC (%)"
                  value={socStats.avg.toFixed(1)}
                  prefix={<TrendingUp className="h-3 w-3" />}
                  valueStyle={{ fontSize: "14px", color: "#722ed1" }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {socStats.min.toFixed(0)} - {socStats.max.toFixed(0)}
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        <Divider />

        
        <div className="space-y-6">
          <h4 className="text-sm font-semibold mb-3" style={{ color: "#ff4d4f" }}>
            Biểu đồ dữ liệu Pin
          </h4>

          
          <Row gutter={[16, 16]}>
            
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
                          {voltageStats.min.toFixed(2)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {voltageStats.avg.toFixed(2)}
                        </td>
                        <td className="text-right p-2 text-green-600">
                          {voltageStats.max.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Dòng điện (A)</td>
                        <td className="text-right p-2 text-red-600">
                          {currentStats.min.toFixed(2)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {currentStats.avg.toFixed(2)}
                        </td>
                        <td className="text-right p-2 text-green-600">
                          {currentStats.max.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Nhiệt độ (°C)</td>
                        <td className="text-right p-2 text-blue-600">
                          {tempStats.min.toFixed(1)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {tempStats.avg.toFixed(1)}
                        </td>
                        <td className="text-right p-2 text-orange-600">
                          {tempStats.max.toFixed(1)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">SOC (%)</td>
                        <td className="text-right p-2 text-red-600">{socStats.min.toFixed(0)}</td>
                        <td className="text-right p-2 font-semibold">
                          {socStats.avg.toFixed(1)}
                        </td>
                        <td className="text-right p-2 text-green-600">{socStats.max.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">SOH (%)</td>
                        <td className="text-right p-2 text-red-600">{sohStats.min.toFixed(0)}</td>
                        <td className="text-right p-2 font-semibold">
                          {sohStats.avg.toFixed(1)}
                        </td>
                        <td className="text-right p-2 text-green-600">{sohStats.max.toFixed(0)}</td>
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


                  if (typeof conclusion === "string") {
                    try {
                      const parsed = JSON.parse(conclusion);
                      if (
                        typeof parsed === "object" &&
                        parsed !== null &&
                        !Array.isArray(parsed)
                      ) {
                        conclusionObj = parsed;
                      } else if (Array.isArray(parsed)) {
                        conclusionObj = parsed.reduce((acc, item) => ({ ...acc, ...item }), {});
                      }
                    } catch (e) {
                      try {
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
                        
                        
                        if (jsonMatches && jsonMatches.length > 0) {
                          conclusionObj = {};
                          jsonMatches.forEach((match, idx) => {
                            try {
                              const parsed = JSON.parse(match.trim());
                              if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                                Object.keys(parsed).forEach(key => {
                                  conclusionObj[key] = parsed[key];
                                });
                              }
                            } catch (err) {
                            }
                          });
                        }
                      } catch (e2) {
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
                    conclusionObj = conclusion.reduce((acc, item) => ({ ...acc, ...item }), {});
                  }

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

                    return (
                      <div className="space-y-6">
                        
                        <div>
                          
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
                      </div>
                    );
                  }

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
