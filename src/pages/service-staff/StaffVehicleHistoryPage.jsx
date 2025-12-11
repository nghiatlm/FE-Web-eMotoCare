// src/pages/service-staff/StaffVehicleHistoryPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Input, Card, Spin, Empty, Select, DatePicker, Space } from "antd";
import { Search, Car, Filter } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;

import { fetchAppointments } from "../../services/appointmentService";
import { getStaffByAccountId } from "../../api/staffsApi";

// ✅ Hàm dịch màu sắc từ tiếng Anh sang tiếng Việt
const translateColor = (color) => {
  if (!color) return "";
  const colorUpper = String(color).trim().toUpperCase();
  const colorMap = {
    "BLUE": "Xanh dương",
    "RED": "Đỏ",
    "GREEN": "Xanh lá",
    "YELLOW": "Vàng",
    "BLACK": "Đen",
    "WHITE": "Trắng",
    "GRAY": "Xám",
    "GREY": "Xám",
    "SILVER": "Bạc",
    "GOLD": "Vàng",
    "ORANGE": "Cam",
    "PURPLE": "Tím",
    "PINK": "Hồng",
    "BROWN": "Nâu",
  };
  return colorMap[colorUpper] || color;
};

export default function StaffVehicleHistoryPage() {
  const navigate = useNavigate();
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceCenterId, setServiceCenterId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // ================== LOAD SERVICE CENTER ID ==================
  useEffect(() => {
    const loadServiceCenterId = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          console.warn("⚠️ Không tìm thấy user trong localStorage");
          return;
        }

        const user = JSON.parse(userStr);
        console.log("🔍 User from localStorage:", user);
        
        // ✅ Thử nhiều cách lấy accountId
        const accountId = user?.accountResponse?.id || user?.id || user?.accountId;
        console.log("🔍 AccountId:", accountId);

        if (accountId) {
          const staffRes = await getStaffByAccountId(accountId);
          console.log("🔍 Staff response:", staffRes);
          console.log("🔍 Staff response.data:", staffRes?.data);
          
          // ✅ Parse staff data từ response (axios đã unwrap response.data)
          // getStaffByAccountId trả về: { data: { rowDatas: [...] } } hoặc { data: [...] }
          let staff = null;
          if (staffRes?.data?.rowDatas && Array.isArray(staffRes.data.rowDatas) && staffRes.data.rowDatas.length > 0) {
            staff = staffRes.data.rowDatas[0];
          } else if (staffRes?.data && Array.isArray(staffRes.data) && staffRes.data.length > 0) {
            staff = staffRes.data[0];
          } else if (staffRes?.rowDatas && Array.isArray(staffRes.rowDatas) && staffRes.rowDatas.length > 0) {
            staff = staffRes.rowDatas[0];
          } else if (staffRes?.data && !Array.isArray(staffRes.data)) {
            staff = staffRes.data;
          } else if (staffRes && !Array.isArray(staffRes)) {
            staff = staffRes;
          }
          
          console.log("🔍 Parsed staff:", staff);
          
          const serviceCenterId = staff?.serviceCenterId || staff?.serviceCenter?.id;
          console.log("🔍 ServiceCenterId:", serviceCenterId);
          
          if (serviceCenterId) {
            setServiceCenterId(serviceCenterId);
          } else {
            console.warn("⚠️ Không tìm thấy serviceCenterId trong staff data");
            console.warn("⚠️ Staff object keys:", staff ? Object.keys(staff) : "staff is null");
          }
        } else {
          console.warn("⚠️ Không tìm thấy accountId");
        }
      } catch (err) {
        console.error("❌ Lỗi khi lấy serviceCenterId:", err);
        toast.error("Không thể lấy thông tin trung tâm dịch vụ");
      }
    };

    loadServiceCenterId();
  }, []);

  // ================== LOAD VEHICLE HISTORY ==================
  const loadVehicleHistory = async () => {
    if (!serviceCenterId) {
      console.warn("⚠️ Chưa có serviceCenterId, không thể load vehicle history");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Loading vehicle history với serviceCenterId:", serviceCenterId);
      
      // ✅ Lấy tất cả appointments đã hoàn thành tại trung tâm này
      const response = await fetchAppointments({
        page: 1,
        pageSize: 1000,
        serviceCenterId,
      });

      console.log("🔍 fetchAppointments response:", response);
      console.log("🔍 response.data:", response?.data);
      console.log("🔍 response.data?.rowDatas:", response?.data?.rowDatas);

      // ✅ Xử lý response structure từ API
      // fetchAppointments gọi getAppointments -> api.get -> axios trả về { data: {...} }
      // getAppointments trả về response.data (đã unwrap bởi axios interceptor)
      let appointmentsList = [];
      
      // ✅ Thử nhiều cách parse response
      if (Array.isArray(response)) {
        appointmentsList = response;
      } else if (Array.isArray(response?.data)) {
        appointmentsList = response.data;
      } else if (Array.isArray(response?.rowDatas)) {
        appointmentsList = response.rowDatas;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        appointmentsList = response.data.data;
      } else if (response?.data?.rowDatas && Array.isArray(response.data.rowDatas)) {
        appointmentsList = response.data.rowDatas;
      } else if (response?.data?.data?.rowDatas && Array.isArray(response.data.data.rowDatas)) {
        appointmentsList = response.data.data.rowDatas;
      }
      
      if (appointmentsList.length === 0 && response) {
        console.warn("⚠️ Không parse được appointmentsList từ response:", response);
        console.warn("⚠️ Response structure:", Object.keys(response));
      }

      console.log("🔍 Parsed appointmentsList:", appointmentsList);
      console.log("🔍 Total appointments:", appointmentsList.length);

      // ✅ Filter chỉ lấy những appointment đã hoàn thành sửa chữa
      const completedAppointments = appointmentsList.filter(
        (apt) =>
          apt.status === "COMPLETED" ||
          apt.status === "REPAIR_COMPLETED"
      );
      
      console.log("🔍 Completed appointments:", completedAppointments.length);

      // ✅ Group by vehicleId để loại bỏ duplicate và lấy thông tin mới nhất
      const vehicleMap = new Map();
      completedAppointments.forEach((apt) => {
        if (!apt.vehicle || !apt.vehicle.id) return;

        const vehicleId = apt.vehicle.id;
        const existing = vehicleMap.get(vehicleId);

        if (!existing) {
          // ✅ Lần đầu gặp xe này
          vehicleMap.set(vehicleId, {
            vehicle: apt.vehicle,
            customer: apt.customer,
            lastAppointmentDate: apt.appointmentDate || apt.createdAt,
            lastAppointmentId: apt.id,
            appointmentCount: 1,
          });
        } else {
          // ✅ Đã có xe này, tăng số lần và cập nhật thông tin mới nhất nếu cần
          existing.appointmentCount = (existing.appointmentCount || 0) + 1;
          
          // ✅ Cập nhật thông tin mới nhất nếu appointment này mới hơn
          const currentDate = new Date(apt.appointmentDate || apt.createdAt);
          const existingDate = new Date(existing.lastAppointmentDate || existing.createdAt);
          if (currentDate > existingDate) {
            existing.lastAppointmentDate = apt.appointmentDate || apt.createdAt;
            existing.lastAppointmentId = apt.id;
            existing.vehicle = apt.vehicle;
            existing.customer = apt.customer;
          }
        }
      });

      // ✅ Convert map to array
      const vehicleHistory = Array.from(vehicleMap.values()).map((item) => ({
        ...item.vehicle,
        customer: item.customer,
        lastAppointmentDate: item.lastAppointmentDate,
        lastAppointmentId: item.lastAppointmentId,
        appointmentCount: item.appointmentCount || 1,
      }));

      console.log("🔍 Final vehicleHistory:", vehicleHistory);
      console.log("🔍 Total vehicles:", vehicleHistory.length);

      setVehicleList(vehicleHistory);
      
      if (vehicleHistory.length === 0) {
        console.warn("⚠️ Không có xe nào đã sửa chữa tại trung tâm này");
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải lịch sử xe:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách xe đã sửa chữa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceCenterId) {
      loadVehicleHistory();
    }
  }, [serviceCenterId]);

  // ================== GET UNIQUE MODELS ==================
  const uniqueModels = useMemo(() => {
    const models = new Set();
    vehicleList.forEach((item) => {
      if (item.modelName) {
        models.add(item.modelName);
      }
    });
    return Array.from(models).sort();
  }, [vehicleList]);

  // ================== FILTER ==================
  const filteredData = useMemo(() => {
    return (vehicleList || []).filter((item) => {
      // ✅ Filter theo search text
      if (search) {
        const lowerSearch = search.toLowerCase();
        const chassisNumber = item.chassisNumber?.toLowerCase() || "";
        const modelName = item.modelName?.toLowerCase() || "";
        const customerName = item.customer
          ? `${item.customer.firstName || ""} ${item.customer.lastName || ""}`
              .trim()
              .toLowerCase()
          : "";
        const plateNumber = item.plateNumber?.toLowerCase() || "";

        const matchesSearch =
          chassisNumber.includes(lowerSearch) ||
          modelName.includes(lowerSearch) ||
          customerName.includes(lowerSearch) ||
          plateNumber.includes(lowerSearch);

        if (!matchesSearch) return false;
      }

      // ✅ Filter theo mẫu xe
      if (selectedModel && item.modelName !== selectedModel) {
        return false;
      }

      // ✅ Filter theo khoảng thời gian (dựa trên lastAppointmentDate)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const appointmentDate = dayjs(item.lastAppointmentDate);
        const startDate = dateRange[0].startOf("day");
        const endDate = dateRange[1].endOf("day");

        if (!appointmentDate.isValid() || appointmentDate.isBefore(startDate) || appointmentDate.isAfter(endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [vehicleList, search, selectedModel, dateRange]);

  // ================== ACTION: XEM CHI TIẾT ==================
  const handleViewDetail = (record) => {
    navigate(`/staff/vehicles/${record.id}/history`);
  };

  // ================== TABLE ==================
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, idx) => idx + 1,
      width: 50,
      align: "center",
    },
    {
      title: "Số khung (VIN)",
      dataIndex: "chassisNumber",
      key: "chassisNumber",
      width: 120,
      ellipsis: {
        showTitle: true,
      },
      render: (text) => (
        <Tag color="red" style={{ borderRadius: 6, fontSize: 12 }}>
          {text || ""}
        </Tag>
      ),
    },
    {
      title: "Mẫu xe",
      dataIndex: "modelName",
      key: "modelName",
      width: 140,
      ellipsis: {
        showTitle: true,
      },
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 140,
      ellipsis: {
        showTitle: true,
      },
      render: (_, record) => {
        const customer = record.customer;
        if (!customer) return "";
        return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
      },
    },
    
    {
      title: "Màu sắc",
      dataIndex: "color",
      key: "color",
      width: 100,
      render: (color) => (
        <Tag color="red" style={{ borderRadius: 6, fontSize: 12 }}>
          {translateColor(color) || ""}
        </Tag>
      ),
    },
    {
      title: "Số lần",
      dataIndex: "appointmentCount",
      key: "appointmentCount",
      width: 90,
      align: "center",
      render: (count) => (
        <Tag color="blue" style={{ borderRadius: 6, fontSize: 12 }}>
          {count || 0} lần
        </Tag>
      ),
    },
    {
      title: "Lần sửa gần nhất",
      dataIndex: "lastAppointmentDate",
      key: "lastAppointmentDate",
      width: 140,
      ellipsis: {
        showTitle: true,
      },
      render: (date) => {
        if (!date) return "";
        return dayjs(date).format("DD/MM/YYYY HH:mm");
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button 
          type='link' 
          onClick={() => handleViewDetail(record)}
          style={{
            color: "#ff4d4f",
            fontWeight: 500,
            padding: 0,
            fontSize: "12px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ff7875";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#ff4d4f";
          }}>
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", overflowX: "hidden" }}>
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
              }}>
              <Car size={20} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                  color: "#262626",
                }}>
                Danh sách xe đã sửa chữa
              </h2>
              <p style={{ margin: 0, color: "#8c8c8c", fontSize: 14 }}>
                Xem lịch sử các xe đã từng sửa chữa tại trung tâm
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Input
            prefix={<Search size={16} />}
            placeholder="Tìm kiếm theo số khung, mẫu xe, khách hàng"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 400, flex: 1, minWidth: 250 }}
            size="large"
          />
          
          <Select
            placeholder="Chọn mẫu xe"
            value={selectedModel}
            onChange={setSelectedModel}
            allowClear
            style={{ width: 200 }}
            size="large"
            options={uniqueModels.map((model) => ({
              label: model,
              value: model,
            }))}
          />

          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            style={{ width: 280 }}
            size="large"
            allowClear
            disabledDate={(current) => {
              // ✅ Không cho chọn ngày tương lai
              return current && current > dayjs().endOf("day");
            }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : filteredData.length === 0 ? (
          <Empty
            description="Không có dữ liệu"
            style={{ padding: "40px 0" }}
          />
        ) : (
          <div style={{ overflowX: "hidden", width: "100%" }}>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} xe`,
              }}
              size="small"
              style={{ width: "100%" }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
