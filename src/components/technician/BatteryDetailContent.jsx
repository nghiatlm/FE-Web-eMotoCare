

import {
  Card,
  Row,
  Col,
  Tag,
  Alert,
  Typography,
  Space,
  Table,
  Statistic,
  Divider,
} from "antd";
import {
  Zap,
  TrendingDown,
  Activity,
  TrendingUp,
  Thermometer,
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



  const currentArray = (power && power.length > 0) ? power : (currentFromData && currentFromData.length > 0 ? currentFromData : []);




  const calculateStats = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    const validValues = arr.filter(v => v !== null && v !== undefined && !isNaN(v)).map(v => Number(v));
    if (validValues.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
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
        data: time.map((t, idx) => [t, currentArray[idx] || 0]),
        lineStyle: { width: 2, color: "#91cc75" },
        itemStyle: { color: "#91cc75" },
        yAxisIndex: 1,
      },
    ],
  };


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


  return (
    <div style={{ padding: "16px 0" }}>
      
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#ff4d4f" }}>
          Tóm tắt nhanh
        </h4>
        <Row gutter={[8, 8]}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Điện áp (V)"
                value={voltageStats.avg.toFixed(2)}
                prefix={<Zap style={{ width: 12, height: 12 }} />}
                valueStyle={{ fontSize: "14px", color: "#1890ff" }}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                {voltageStats.min.toFixed(1)} - {voltageStats.max.toFixed(1)}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Dòng điện (A)"
                value={currentStats.avg.toFixed(2)}
                prefix={<Activity style={{ width: 12, height: 12 }} />}
                valueStyle={{ fontSize: "14px", color: "#52c41a" }}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                {currentStats.min.toFixed(1)} - {currentStats.max.toFixed(1)}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Nhiệt độ (°C)"
                value={tempStats.avg.toFixed(1)}
                prefix={<Thermometer style={{ width: 12, height: 12 }} />}
                valueStyle={{ fontSize: "14px", color: "#fa8c16" }}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                {tempStats.min.toFixed(1)} - {tempStats.max.toFixed(1)}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="SOC (%)"
                value={socStats.avg.toFixed(1)}
                prefix={<TrendingUp style={{ width: 12, height: 12 }} />}
                valueStyle={{ fontSize: "14px", color: "#722ed1" }}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                {socStats.min.toFixed(0)} - {socStats.max.toFixed(0)}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider />

      
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#ff4d4f" }}>
          Biểu đồ dữ liệu Pin
        </h4>
        {time.length > 0 && (
          <Row gutter={[16, 16]}>
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
      </div>

      
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

      
      {conclusion && Object.keys(conclusion).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Divider orientation="left">
            <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
              Kết luận đánh giá Pin
            </Title>
          </Divider>
          
          <div style={{ marginTop: 24 }}>
            <Row gutter={[20, 20]}>
              
              {conclusion.energyCapability && (
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "#f6ffed",
                      border: "1px solid #b7eb8f",
                      borderLeft: "5px solid #52c41a",
                      borderRadius: "10px",
                      height: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    bodyStyle={{ padding: "20px" }}
                    hoverable
                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <div 
                          style={{ 
                            color: "#52c41a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(82, 196, 26, 0.15)",
                          }}
                        >
                          <Zap size={20} />
                        </div>
                        <Title 
                          level={5} 
                          style={{ 
                            margin: 0, 
                            color: "#52c41a",
                            fontWeight: 600,
                            fontSize: "16px",
                            lineHeight: "1.5",
                          }}
                        >
                          Khả năng cung cấp năng lượng
                        </Title>
                      </div>
                      <Paragraph
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.75,
                          color: "#262626",
                          fontSize: "14px",
                          margin: 0,
                          textAlign: "justify",
                        }}
                      >
                        {conclusion.energyCapability}
                      </Paragraph>
                    </Space>
                  </Card>
                </Col>
              )}

              
              {conclusion.chargeDischargeEfficiency && (
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "#f0f5ff",
                      border: "1px solid #adc6ff",
                      borderLeft: "5px solid #1890ff",
                      borderRadius: "10px",
                      height: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    bodyStyle={{ padding: "20px" }}
                    hoverable
                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <div 
                          style={{ 
                            color: "#1890ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(24, 144, 255, 0.15)",
                          }}
                        >
                          <Activity size={20} />
                        </div>
                        <Title 
                          level={5} 
                          style={{ 
                            margin: 0, 
                            color: "#1890ff",
                            fontWeight: 600,
                            fontSize: "16px",
                            lineHeight: "1.5",
                          }}
                        >
                          Hiệu suất nạp/xả
                        </Title>
                      </div>
                      <Paragraph
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.75,
                          color: "#262626",
                          fontSize: "14px",
                          margin: 0,
                          textAlign: "justify",
                        }}
                      >
                        {conclusion.chargeDischargeEfficiency}
                      </Paragraph>
                    </Space>
                  </Card>
                </Col>
              )}

              
              {conclusion.degradationStatus && (
                <Col xs={24} sm={24} md={8}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "#fffbe6",
                      border: "1px solid #ffe58f",
                      borderLeft: "5px solid #faad14",
                      borderRadius: "10px",
                      height: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    bodyStyle={{ padding: "20px" }}
                    hoverable
                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <div 
                          style={{ 
                            color: "#faad14",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(250, 173, 20, 0.15)",
                          }}
                        >
                          <TrendingDown size={20} />
                        </div>
                        <Title 
                          level={5} 
                          style={{ 
                            margin: 0, 
                            color: "#faad14",
                            fontWeight: 600,
                            fontSize: "16px",
                            lineHeight: "1.5",
                          }}
                        >
                          Tình trạng xuống cấp
                        </Title>
                      </div>
                      <Paragraph
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.75,
                          color: "#262626",
                          fontSize: "14px",
                          margin: 0,
                          textAlign: "justify",
                        }}
                      >
                        {conclusion.degradationStatus}
                      </Paragraph>
                    </Space>
                  </Card>
                </Col>
              )}
            </Row>

            
            <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
              
              {conclusion.remainingUsefulLife && (
                <Col xs={24} sm={24} md={12}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "#f9f0ff",
                      border: "1px solid #d3adf7",
                      borderLeft: "5px solid #722ed1",
                      borderRadius: "10px",
                      height: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    bodyStyle={{ padding: "20px" }}
                    hoverable
                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <div 
                          style={{ 
                            color: "#722ed1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(114, 46, 209, 0.15)",
                          }}
                        >
                          <TrendingUp size={20} />
                        </div>
                        <Title 
                          level={5} 
                          style={{ 
                            margin: 0, 
                            color: "#722ed1",
                            fontWeight: 600,
                            fontSize: "16px",
                            lineHeight: "1.5",
                          }}
                        >
                          Tuổi thọ còn lại
                        </Title>
                      </div>
                      <Paragraph
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.75,
                          color: "#262626",
                          fontSize: "14px",
                          margin: 0,
                          textAlign: "justify",
                        }}
                      >
                        {conclusion.remainingUsefulLife}
                      </Paragraph>
                    </Space>
                  </Card>
                </Col>
              )}

              
              {conclusion.safety && (
                <Col xs={24} sm={24} md={12}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "#fff1f0",
                      border: "1px solid #ffccc7",
                      borderLeft: "5px solid #ff4d4f",
                      borderRadius: "10px",
                      height: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    bodyStyle={{ padding: "20px" }}
                    hoverable
                  >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <div 
                          style={{ 
                            color: "#ff4d4f",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 77, 79, 0.15)",
                          }}
                        >
                          <Activity size={20} />
                        </div>
                        <Title 
                          level={5} 
                          style={{ 
                            margin: 0, 
                            color: "#ff4d4f",
                            fontWeight: 600,
                            fontSize: "16px",
                            lineHeight: "1.5",
                          }}
                        >
                          An toàn
                        </Title>
                      </div>
                      <Paragraph
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.75,
                          color: "#262626",
                          fontSize: "14px",
                          margin: 0,
                          textAlign: "justify",
                        }}
                      >
                        {conclusion.safety}
                      </Paragraph>
                    </Space>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        </div>
      )}
    </div>
  );
}
