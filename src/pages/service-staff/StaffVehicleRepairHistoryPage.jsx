// src/pages/service-staff/StaffVehicleRepairHistoryPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Tag, Button, Card, Spin, Empty, Space, Typography } from "antd";
import { ArrowLeft, Car, Hash, Palette, Wrench, User, Phone, Mail, FileText } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { STATUS_COLORS, STATUS_MAP, UI_COLORS } from "../../utils/constants";

import { fetchAppointments } from "../../services/appointmentService";
import { getAppointmentById } from "../../api/appointmentsApi";
import PaymentInfo from "../../components/service-staff/PaymentInfo";
import PaymentHistory from "../../components/service-staff/PaymentHistory";
import { fetchEVCheckByAppointmentService } from "../../services/evcheckService";
import RepairModeEVCheck from "../../components/technician/detail-content/RepairModeEVCheck";
import RMARepairModeEVCheck from "../../components/technician/detail-content/RMARepairModeEVCheck";
import MaintenanceModeEVCheck from "../../components/technician/detail-content/MaintenanceModeEVCheck";
import CampaignModeEVCheck from "../../components/technician/detail-content/CampaignModeEVCheck";

const { Text } = Typography;

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

export default function StaffVehicleRepairHistoryPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [currentEVCheckId, setCurrentEVCheckId] = useState(null);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [loadingEVCheck, setLoadingEVCheck] = useState(false);

  // ================== LOAD APPOINTMENTS ==================
  const loadAppointments = async () => {
    if (!vehicleId) return;

    setLoading(true);
    try {
      const response = await fetchAppointments({
        page: 1,
        pageSize: 1000,
      });

      // ✅ Parse response
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

      // ✅ Filter appointments của xe này và đã hoàn thành
      const vehicleAppointments = appointmentsList.filter(
        (apt) =>
          apt.vehicle?.id === vehicleId &&
          (apt.status === "COMPLETED" || apt.status === "REPAIR_COMPLETED")
      );

      // ✅ Sắp xếp theo ngày (mới nhất trước)
      vehicleAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate || a.createdAt);
        const dateB = new Date(b.appointmentDate || b.createdAt);
        return dateB - dateA;
      });

      // ✅ Lấy thông tin xe và khách hàng từ appointment đầu tiên
      if (vehicleAppointments.length > 0) {
        setVehicleInfo({
          vehicle: vehicleAppointments[0].vehicle,
          customer: vehicleAppointments[0].customer,
        });
        
        // ✅ Tự động load thông tin đầy đủ của appointment đầu tiên (bao gồm EVCheck)
        const firstAppointmentId = vehicleAppointments[0].id;
        if (firstAppointmentId) {
          // ✅ Load booking detail và EVCheck của appointment đầu tiên
          try {
            setLoadingBooking(true);
            setLoadingEVCheck(true);
            
            const res = await getAppointmentById(firstAppointmentId);
            const bookingData = res?.data?.data || res?.data || res;
            if (bookingData) {
              setSelectedBooking(bookingData);
              
              // ✅ Load EVCheck details
              try {
                const evCheck = await fetchEVCheckByAppointmentService(bookingData.id);
                if (evCheck) {
                  // ✅ Handle response format
                  let evCheckData = null;
                  if (Array.isArray(evCheck)) {
                    evCheckData = evCheck[evCheck.length - 1]; // Lấy cái mới nhất
                  } else if (evCheck?.data?.rowDatas && Array.isArray(evCheck.data.rowDatas)) {
                    evCheckData = evCheck.data.rowDatas[evCheck.data.rowDatas.length - 1];
                  } else if (evCheck?.rowDatas && Array.isArray(evCheck.rowDatas)) {
                    evCheckData = evCheck.rowDatas[evCheck.rowDatas.length - 1];
                  } else {
                    evCheckData = evCheck;
                  }

                  if (evCheckData) {
                    setCurrentEVCheckId(evCheckData.id);
                    setEvCheckStatus(evCheckData.status || null);
                  }
                }
              } catch (evErr) {
                console.error("❌ Lỗi khi tự động load EVCheck đầu tiên:", evErr);
              } finally {
                setLoadingEVCheck(false);
              }
            }
          } catch (err) {
            console.error("❌ Lỗi khi tự động load booking đầu tiên:", err);
          } finally {
            setLoadingBooking(false);
          }
        }
      }

      setAppointments(vehicleAppointments);
    } catch (err) {
      console.error("❌ Lỗi khi tải lịch sử sửa chữa:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải lịch sử sửa chữa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [vehicleId]);

  // ================== HANDLE VIEW DETAIL ==================
  const handleViewDetail = async (appointmentId) => {
    // ✅ Nếu đang xem booking này rồi thì ẩn đi
    if (selectedBooking?.id === appointmentId) {
      setSelectedBooking(null);
      setCurrentEVCheckId(null);
      setEvCheckStatus(null);
      return;
    }

    setLoadingBooking(true);
    setLoadingEVCheck(true);
    try {
      const res = await getAppointmentById(appointmentId);
      // ✅ Parse response giống như StaffBookingDetailPage
      const bookingData = res?.data?.data || res?.data || res;
      if (bookingData) {
        setSelectedBooking(bookingData);
        
        // ✅ Load EVCheck details
        try {
          const evCheck = await fetchEVCheckByAppointmentService(bookingData.id);
          if (evCheck) {
            // ✅ Handle response format
            let evCheckData = null;
            if (Array.isArray(evCheck)) {
              evCheckData = evCheck[evCheck.length - 1]; // Lấy cái mới nhất
            } else if (evCheck?.data?.rowDatas && Array.isArray(evCheck.data.rowDatas)) {
              evCheckData = evCheck.data.rowDatas[evCheck.data.rowDatas.length - 1];
            } else if (evCheck?.rowDatas && Array.isArray(evCheck.rowDatas)) {
              evCheckData = evCheck.rowDatas[evCheck.rowDatas.length - 1];
            } else {
              evCheckData = evCheck;
            }

            if (evCheckData) {
              setCurrentEVCheckId(evCheckData.id);
              setEvCheckStatus(evCheckData.status || null);
            }
          }
        } catch (evErr) {
          console.error("❌ Lỗi khi tải EVCheck:", evErr);
        }
      } else {
        toast.error("Không tìm thấy thông tin booking");
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải thông tin booking:", err);
      toast.error("Không thể tải thông tin chi tiết");
    } finally {
      setLoadingBooking(false);
      setLoadingEVCheck(false);
    }
  };

  // ================== TABLE COLUMNS ==================
  const columns = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center",
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Mã đặt lịch",
      dataIndex: "code",
      key: "code",
      width: 150,
      ellipsis: true,
      render: (code) => (
        <span style={{ fontWeight: 600, color: "#262626" }}>{code || ""}</span>
      ),
    },
    {
      title: "Ngày sửa",
      key: "date",
      width: 120,
      render: (_, record) => {
        const date = record.appointmentDate || record.createdAt;
        return date ? dayjs(date).format("DD/MM/YYYY") : "—";
      },
    },
    {
      title: "Thời gian",
      dataIndex: "slotTime",
      key: "slotTime",
      width: 100,
      render: (slot) => {
        if (!slot) return "—";
        const [start, end] = slot.replace("H", "").split("_");
        return `${start}:00-${end}:00`;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => {
        if (!status) return <Tag></Tag>;
        const key = String(status).toUpperCase();
        return (
          <Tag color={STATUS_COLORS[key] || "default"}>
            {STATUS_MAP[key] || status}
          </Tag>
        );
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
          onClick={() => handleViewDetail(record.id)}
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
    <div style={{ padding: "24px" }}>
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/staff/vehicles")}
            style={{ marginBottom: 16, color: "#ff4d4f" }}>
            Quay lại
          </Button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
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
                Lịch sử sửa chữa
              </h2>
            </div>
          </div>

          {/* Thông tin khách hàng và xe - Cards */}
          {vehicleInfo && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, marginBottom: 24 }}>
              {/* Card Thông tin khách hàng */}
              {vehicleInfo.customer && (
                <Card
                  style={{ 
                    borderRadius: 12,
                    border: "1px solid #e8e8e8",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                  bodyStyle={{ padding: "24px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                    Thông tin khách hàng
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(vehicleInfo.customer.firstName || vehicleInfo.customer.lastName) && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <User size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                            Họ tên:
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                          {`${vehicleInfo.customer.firstName || ""} ${vehicleInfo.customer.lastName || ""}`.trim()}
                        </Text>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                      <Space size={8}>
                        <Phone size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                        <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                          SĐT:
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                        {vehicleInfo.customer.account?.phone || vehicleInfo.customer.phoneNumber || vehicleInfo.customer.phone || "—"}
                      </Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                      <Space size={8}>
                        <Mail size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                        <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                          Email:
                        </Text>
                      </Space>
                      <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                        {vehicleInfo.customer.account?.email || vehicleInfo.customer.email || "—"}
                      </Text>
                    </div>
                  </div>
                </Card>
              )}

              {/* Card Thông tin phương tiện */}
              {vehicleInfo.vehicle && (
                <Card
                  style={{ 
                    borderRadius: 12,
                    border: "1px solid #e8e8e8",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                  bodyStyle={{ padding: "24px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                    Thông tin phương tiện
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(vehicleInfo.vehicle.modelName || vehicleInfo.vehicle.model?.name) && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Car size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                            Mẫu xe:
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                          {vehicleInfo.vehicle.modelName || vehicleInfo.vehicle.model?.name}
                        </Text>
                      </div>
                    )}
                    
                    {vehicleInfo.vehicle.engineNumber && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Wrench size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                            Số máy:
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                          {vehicleInfo.vehicle.engineNumber}
                        </Text>
                      </div>
                    )}
                    
                    {vehicleInfo.vehicle.chassisNumber && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                            Số khung (VIN):
                          </Text>
                        </Space>
                        <Tag color="red" style={{ borderRadius: 6, fontSize: 12 }}>
                          {vehicleInfo.vehicle.chassisNumber}
                        </Tag>
                      </div>
                    )}
                    
                    {vehicleInfo.vehicle.color && (
                      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "12px" }}>
                        <Space size={8}>
                          <Palette size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                            Màu sắc:
                          </Text>
                        </Space>
                        <Tag color="red" style={{ borderRadius: 6, fontSize: 12 }}>
                          {translateColor(vehicleInfo.vehicle.color)}
                        </Tag>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : appointments.length === 0 ? (
          <Empty
            description="Không có lịch sử sửa chữa"
            style={{ padding: "40px 0" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={appointments}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} lần sửa chữa`,
            }}
            size="small"
          />
        )}

        {/* ✅ Hiển thị bảng chi tiết hạng mục sửa chữa và thông tin thanh toán khi bấm Xem */}
        {selectedBooking && (
          <div style={{ marginTop: 24 }}>
            {loadingBooking || loadingEVCheck ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin size="large" />
              </div>
            ) : (
              <>
                {/* ✅ Bảng phiếu sửa chữa (EVCheck) */}
                {currentEVCheckId && (
                  <Card
                    style={{
                      marginBottom: 24,
                      borderRadius: 12,
                      border: "1px solid #e8e8e8",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    bodyStyle={{ padding: "24px" }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 16,
                        color: "#d4380d",
                        borderBottom: "1px solid #f0f0f0",
                        paddingBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                      <FileText size={16} color="#d4380d" />
                      {selectedBooking.type === "REPAIR_TYPE"
                        ? "Phiếu sửa chữa"
                        : selectedBooking.type === "MAINTENANCE_TYPE"
                        ? "Kết quả kiểm tra EVCheck"
                        : selectedBooking.type === "CAMPAIGN_TYPE"
                        ? "Phiếu kiểm tra chiến dịch"
                        : "Chi tiết kiểm tra"}
                    </h3>
                    {(() => {
                      const isRepair = selectedBooking.type === "REPAIR_TYPE";
                      const isMaintenance = selectedBooking.type === "MAINTENANCE_TYPE";
                      const isCampaign = selectedBooking.type === "CAMPAIGN_TYPE";
                      const note = (selectedBooking?.note || "").toLowerCase();
                      const isRMABooking = note.includes("lịch thay") && note.includes("rma");

                      if (isRepair && isRMABooking) {
                        return (
                          <RMARepairModeEVCheck
                            key={`rma-repair-${currentEVCheckId}`}
                            booking={selectedBooking}
                            evCheckId={currentEVCheckId}
                            onRefresh={() => {}}
                            readOnly={true}
                            forceEmpty={!currentEVCheckId}
                          />
                        );
                      } else if (isRepair) {
                        return (
                          <RepairModeEVCheck
                            key={`repair-${currentEVCheckId}`}
                            booking={selectedBooking}
                            evCheckId={currentEVCheckId}
                            onRefresh={() => {}}
                            readOnly={true}
                            forceEmpty={!currentEVCheckId}
                          />
                        );
                      } else if (isCampaign) {
                        return (
                          <CampaignModeEVCheck
                            key={`campaign-${currentEVCheckId}`}
                            booking={selectedBooking}
                            evCheckId={currentEVCheckId}
                            evCheckStatus={evCheckStatus}
                            onRefresh={() => {}}
                            readOnly={true}
                            forceEmpty={!currentEVCheckId}
                          />
                        );
                      } else if (isMaintenance && currentEVCheckId) {
                        return (
                          <MaintenanceModeEVCheck
                            key={`maintenance-${currentEVCheckId}-${evCheckStatus}`}
                            booking={selectedBooking}
                            evCheckId={currentEVCheckId}
                            evCheckStatus={evCheckStatus}
                            setEvCheckStatus={setEvCheckStatus}
                            readOnly={true}
                            onRefresh={() => {}}
                          />
                        );
                      }
                      return null;
                    })()}
                  </Card>
                )}

                {/* ✅ Thông tin thanh toán */}
                {currentEVCheckId && (
                  <div style={{ marginBottom: 24 }}>
                    {selectedBooking.status === "COMPLETED" ? (
                      // ✅ Đã hoàn thành: Hiển thị lịch sử thanh toán
                      <PaymentHistory booking={selectedBooking} />
                    ) : (selectedBooking.status === "REPAIR_COMPLETED" || selectedBooking.status === "QUOTE_APPROVED") ? (
                      // ✅ Chưa hoàn thành: Hiển thị thông tin thanh toán
                      <PaymentInfo booking={selectedBooking} />
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

