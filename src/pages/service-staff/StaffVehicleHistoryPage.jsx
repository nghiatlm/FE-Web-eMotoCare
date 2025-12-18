import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Input, Card, Spin, Empty, Select, DatePicker, Space } from "antd";
import { Search, Car, Filter } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;

import { fetchAppointments } from "../../services/appointmentService";
import { getStaffByAccountId } from "../../api/staffsApi";

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

  useEffect(() => {
    const loadServiceCenterId = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          return;
        }

        const user = JSON.parse(userStr);
        
        const accountId = user?.accountResponse?.id || user?.id || user?.accountId;

        if (accountId) {
          const staffRes = await getStaffByAccountId(accountId);
          
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
          
          
          const serviceCenterId = staff?.serviceCenterId || staff?.serviceCenter?.id;
          
          if (serviceCenterId) {
            setServiceCenterId(serviceCenterId);
          } else {
          }
        } else {
        }
      } catch (err) {
        toast.error("Không thể lấy thông tin trung tâm dịch vụ");
      }
    };

    loadServiceCenterId();
  }, []);

  const loadVehicleHistory = async () => {
    if (!serviceCenterId) {
      return;
    }

    setLoading(true);
    try {
      
      const response = await fetchAppointments({
        page: 1,
        pageSize: 1000,
        serviceCenterId,
      });


      let appointmentsList = [];
      
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
      }


      const completedAppointments = appointmentsList.filter(
        (apt) =>
          apt.status === "COMPLETED" ||
          apt.status === "REPAIR_COMPLETED"
      );
      

      const vehicleMap = new Map();
      completedAppointments.forEach((apt) => {
        if (!apt.vehicle || !apt.vehicle.id) return;

        const vehicleId = apt.vehicle.id;
        const existing = vehicleMap.get(vehicleId);
        
        if (!existing) {
          vehicleMap.set(vehicleId, {
            vehicle: apt.vehicle,
            customer: apt.customer,
            lastAppointmentDate: apt.appointmentDate || apt.createdAt,
            lastAppointmentId: apt.id,
            appointmentCount: 1,
          });
        } else {
          existing.appointmentCount = (existing.appointmentCount || 0) + 1;
          
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

      const vehicleHistory = Array.from(vehicleMap.values()).map((item) => ({
        ...item.vehicle,
        customer: item.customer,
        lastAppointmentDate: item.lastAppointmentDate,
        lastAppointmentId: item.lastAppointmentId,
        appointmentCount: item.appointmentCount || 1,
      }));


      setVehicleList(vehicleHistory);
      
      if (vehicleHistory.length === 0) {
      }
    } catch (err) {
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

  const uniqueModels = useMemo(() => {
    const models = new Set();
    vehicleList.forEach((item) => {
      if (item.modelName) {
        models.add(item.modelName);
      }
    });
    return Array.from(models).sort();
  }, [vehicleList]);

  const filteredData = useMemo(() => {
    return (vehicleList || []).filter((item) => {
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

      if (selectedModel && item.modelName !== selectedModel) {
        return false;
      }

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

  const handleViewDetail = (record) => {
    navigate(`/staff/vehicles/${record.id}/history`);
  };

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
              return current && current > dayjs().endOf("day");
            }}
          />
        </div>

        
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
