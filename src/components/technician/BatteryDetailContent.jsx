// src/components/technician/BatteryDetailContent.jsx
// Component này được sử dụng để hiển thị chi tiết pin trong modal (cho staff) hoặc trong page (cho technician)
import {
  Card,
  Row,
  Col,
  Tag,
  Alert,
  Typography,
  Space,
  Table,
} from "antd";
import {
  Zap,
  TrendingDown,
  Activity,
} from "lucide-react";
import ReactECharts from "echarts-for-react";

const { Title, Paragraph } = Typography;

export default function BatteryDetailContent({ batteryData }) {
  if (!batteryData) {
    return (
      <Alert
        message="Không tìm thấy dữ liệu pin"
        description="Vui lòng import dữ liệu pin trước khi xem chi tiết."
        type="warning"
        showIcon
      />
    );
  }

  // ✅ Parse dữ liệu từ API format mới
  // Dữ liệu có thể đến trực tiếp hoặc từ rowDatas[0]
  const data = batteryData?.rowDatas?.[0] || batteryData;
  
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
  } = data || {};

  // ✅ API trả về `power` thay vì `current`, nhưng hiển thị là "Dòng điện (A)"
  // ✅ Sử dụng power nếu có, nếu không thì dùng current
  const currentArray = (power && power.length > 0) ? power : (currentFromData && currentFromData.length > 0 ? currentFromData : []);

  // ✅ Debug log
  console.log("🔋 BatteryDetailContent - batteryData:", batteryData);
  console.log("🔋 BatteryDetailContent - parsed data:", data);
  console.log("🔋 BatteryDetailContent - time length:", time?.length);
  console.log("🔋 BatteryDetailContent - voltage length:", voltage?.length);
  console.log("🔋 BatteryDetailContent - currentArray length:", currentArray?.length);
  console.log("🔋 BatteryDetailContent - temp length:", temp?.length);
  console.log("🔋 BatteryDetailContent - soc length:", soc?.length);
  console.log("🔋 BatteryDetailContent - soh length:", soh?.length);

  // ✅ Tính toán Min, Max, Trung bình từ arrays
  const calculateStats = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      console.warn("🔋 calculateStats - invalid array:", arr);
      return { min: 0, max: 0, avg: 0 };
    }
    const validValues = arr.filter(v => v !== null && v !== undefined && !isNaN(v)).map(v => Number(v));
    if (validValues.length === 0) {
      console.warn("🔋 calculateStats - no valid values in array:", arr);
      return { min: 0, max: 0, avg: 0 };
    }
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const avg = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    return { min, max, avg };
  };

  const voltageStats = calculateStats(voltage);
  const currentStats = calculateStats(currentArray); // ✅ Dùng currentArray thay vì current
  const tempStats = calculateStats(temp);
  const socStats = calculateStats(soc);
  const sohStats = calculateStats(soh);

  console.log("🔋 BatteryDetailContent - stats:", { voltageStats, currentStats, tempStats, socStats, sohStats });
  console.log("🔋 BatteryDetailContent - summaryData will be:", {
    voltage: voltageStats,
    current: currentStats,
    temp: tempStats,
    soc: socStats,
    soh: sohStats
  });

  // ====== Chart options ======
  
  // ✅ Chart 1: Voltage & Current (line chart theo thời gian)
  const voltageCurrentOption = {
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
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "15%",
      bottom: "20%",
    },
    xAxis: {
      type: "value",
      name: "Thời gian (s)",
      nameLocation: "middle",
      nameGap: 25,
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
        data: time.map((t, idx) => [t, currentArray[idx] || 0]), // ✅ Dùng currentArray
        lineStyle: { width: 2, color: "#91cc75" },
        itemStyle: { color: "#91cc75" },
        yAxisIndex: 1,
      },
    ],
  };

  // ✅ Chart 2: Temperature (line chart theo thời gian)
  const tempOption = {
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
      bottom: "15%",
    },
    xAxis: {
      type: "value",
      name: "Thời gian (s)",
      nameLocation: "middle",
      nameGap: 25,
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
  };

  // ✅ Chart 3: SOC & SOH (line chart theo thời gian)
  const socSohOption = {
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
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "15%",
      bottom: "20%",
    },
    xAxis: {
      type: "value",
      name: "Thời gian (s)",
      nameLocation: "middle",
      nameGap: 25,
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
        itemStyle: { color: "#722ed1", borderWidth: 2, borderColor: "#fff" },
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
        itemStyle: { color: "#eb2f96", borderWidth: 2, borderColor: "#fff" },
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
  };

  // ✅ Bảng tóm tắt số liệu
  const summaryColumns = [
    {
      title: "Chỉ số",
      dataIndex: "metric",
      key: "metric",
      width: 200,
    },
    {
      title: "Min",
      dataIndex: "min",
      key: "min",
      align: "right",
      width: 100,
    },
    {
      title: "Trung bình",
      dataIndex: "avg",
      key: "avg",
      align: "right",
      width: 120,
    },
    {
      title: "Max",
      dataIndex: "max",
      key: "max",
      align: "right",
      width: 100,
    },
  ];

  // ✅ Tạo summary data với fallback
  const formatValue = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return Number(value).toFixed(decimals);
  };

  const summaryData = [
    {
      key: "voltage",
      metric: "Điện áp (V)",
      min: formatValue(voltageStats.min, 2),
      avg: formatValue(voltageStats.avg, 2),
      max: formatValue(voltageStats.max, 2),
    },
    {
      key: "current",
      metric: "Dòng điện (A)",
      min: formatValue(currentStats.min, 2),
      avg: formatValue(currentStats.avg, 2),
      max: formatValue(currentStats.max, 2),
    },
    {
      key: "temp",
      metric: "Nhiệt độ (°C)",
      min: formatValue(tempStats.min, 1),
      avg: formatValue(tempStats.avg, 1),
      max: formatValue(tempStats.max, 1),
    },
    {
      key: "soc",
      metric: "SOC (%)",
      min: formatValue(socStats.min, 1),
      avg: formatValue(socStats.avg, 1),
      max: formatValue(socStats.max, 1),
    },
    {
      key: "soh",
      metric: "SOH (%)",
      min: formatValue(sohStats.min, 1),
      avg: formatValue(sohStats.avg, 1),
      max: formatValue(sohStats.max, 1),
    },
  ];

  console.log("🔋 BatteryDetailContent - summaryData:", summaryData);

  return (
    <div style={{ padding: "16px 0" }}>
      {/* 3 Biểu đồ trên 1 hàng */}
      {time.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Card bodyStyle={{ padding: "16px" }}>
              <ReactECharts 
                option={voltageCurrentOption} 
                style={{ width: "100%", height: "200px" }} 
                notMerge={true}
                lazyUpdate={true}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bodyStyle={{ padding: "16px" }}>
              <ReactECharts 
                option={tempOption} 
                style={{ width: "100%", height: "200px" }} 
                notMerge={true}
                lazyUpdate={true}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bodyStyle={{ padding: "16px" }}>
              <ReactECharts 
                option={socSohOption} 
                style={{ width: "100%", height: "200px" }} 
                notMerge={true}
                lazyUpdate={true}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Bảng tóm tắt số liệu */}
      <Card 
        title="Bảng tóm tắt số liệu"
        bodyStyle={{ padding: "16px" }}
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={summaryColumns}
          dataSource={summaryData}
          pagination={false}
          size="small"
        />
        <div style={{ marginTop: 16, fontSize: 14, color: "#666" }}>
          <strong>Số mẫu:</strong> {sampleCount}
        </div>
      </Card>

      {/* Kết luận đánh giá Pin */}
      {conclusion && Object.keys(conclusion).length > 0 && (
        <Card 
          title={
            <Space>
              <Activity size={16} />
              <span>Kết luận đánh giá Pin</span>
            </Space>
          }
          bodyStyle={{ padding: "16px" }}
        >
          <Row gutter={[16, 16]}>
            {/* Card 1: Khả năng cung cấp năng lượng */}
            {conclusion.energyCapability && (
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
                    border: "none",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Zap size={20} color="#fff" />
                      <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
                        Khả năng cung cấp năng lượng
                      </Title>
                    </div>
                    <Paragraph style={{ color: "#fff", margin: 0, fontSize: 13 }}>
                      {conclusion.energyCapability}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            )}

            {/* Card 2: Hiệu suất nạp/xả */}
            {conclusion.chargeDischargeEfficiency && (
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
                    border: "none",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Activity size={20} color="#fff" />
                      <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
                        Hiệu suất nạp/xả
                      </Title>
                    </div>
                    <Paragraph style={{ color: "#fff", margin: 0, fontSize: 13 }}>
                      {conclusion.chargeDischargeEfficiency}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            )}

            {/* Card 3: Tình trạng xuống cấp */}
            {conclusion.degradationStatus && (
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
                    border: "none",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <TrendingDown size={20} color="#fff" />
                      <Title level={5} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
                        Tình trạng xuống cấp
                      </Title>
                    </div>
                    <Paragraph style={{ color: "#fff", margin: 0, fontSize: 13 }}>
                      {conclusion.degradationStatus}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            )}
          </Row>

          {/* Thông tin bổ sung */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {conclusion.remainingUsefulLife && (
              <Col xs={24}>
                <Alert
                  message="Tuổi thọ còn lại"
                  description={conclusion.remainingUsefulLife}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
            )}
            {conclusion.safety && (
              <Col xs={24}>
                <Alert
                  message="An toàn"
                  description={conclusion.safety}
                  type={conclusion.safety.includes("vượt ngưỡng") || conclusion.safety.includes("quá nhiệt") ? "warning" : "success"}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </Col>
            )}
            {conclusion.solution && (
              <Col xs={24}>
                <Alert
                  message="Giải pháp"
                  description={conclusion.solution}
                  type="info"
                  showIcon
                />
              </Col>
            )}
          </Row>
        </Card>
      )}
    </div>
  );
}
