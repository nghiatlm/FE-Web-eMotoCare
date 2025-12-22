import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RepairModeEVCheck from "../../components/technician/detail-content/RepairModeEVCheck";
import RMARepairModeEVCheck from "../../components/technician/detail-content/RMARepairModeEVCheck";
import MaintenanceModeEVCheck from "../../components/technician/detail-content/MaintenanceModeEVCheck";
import CampaignModeEVCheck from "../../components/technician/detail-content/CampaignModeEVCheck";
import {
  SERVICE_TYPE_MAP,
  SERVICE_TYPE_COLORS,
  UI_COLORS,
} from "../../utils/constants.js";

import {
  Card,
  Divider,
  Button,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import Loading from "../../components/Loading";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Car,
  Hash,
  Palette,
  Calendar,
  Wrench,
  Clock,
  Building,
  User,
  Gauge,
} from "lucide-react";
const { Text } = Typography;

const translateColor = (color) => {
  if (!color) return "";
  const colorUpper = String(color).trim().toUpperCase();
  const colorMap = {
    BLUE: "Xanh dương",
    RED: "Đỏ",
    GREEN: "Xanh lá",
    YELLOW: "Vàng",
    BLACK: "Đen",
    WHITE: "Trắng",
    GRAY: "Xám",
    GREY: "Xám",
    SILVER: "Bạc",
    GOLD: "Vàng",
    ORANGE: "Cam",
    PURPLE: "Tím",
    PINK: "Hồng",
    BROWN: "Nâu",
  };
  return colorMap[colorUpper] || color;
};

// Hàm chuyển tên màu thành mã hex để hiển thị màu thực tế
const getColorHex = (color) => {
  if (!color) return "#999999"; // Màu xám mặc định
  const colorUpper = String(color).trim().toUpperCase();
  const colorHexMap = {
    BLUE: "#1890ff",
    RED: "#ff4d4f",
    GREEN: "#52c41a",
    YELLOW: "#fadb14",
    BLACK: "#000000",
    WHITE: "#ffffff",
    GRAY: "#8c8c8c",
    GREY: "#8c8c8c",
    SILVER: "#c0c0c0",
    GOLD: "#ffd700",
    ORANGE: "#fa8c16",
    PURPLE: "#722ed1",
    PINK: "#eb2f96",
    BROWN: "#8b4513",
  };
  return colorHexMap[colorUpper] || color; // Nếu không tìm thấy, trả về giá trị gốc (có thể đã là hex)
};

import {
  fetchEVCheckByAppointmentService,
  updateEVCheckService,
} from "../../services/evcheckService.js";
import { useBookings } from "../../hooks/useBookings";

export default function TechnicianBookingDetailPage({
  bookingId: propBookingId,
  onBack,
  readOnly = false,
  initialEVCheckId,
}) {
  const params = useParams();
  const navigate = useNavigate();
  const { data, loading: bookingsLoading } = useBookings();

  const bookingId = propBookingId || params.id;

  const booking = data.find((b) => b.id === bookingId);

  const [loading, setLoading] = useState(false);
  const [km, setKm] = useState("");
  const [evCheckId, setEvCheckId] = useState(null);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasOdometer, setHasOdometer] = useState(false);

  const isRepair = (booking?.type || "").toUpperCase() === "REPAIR_TYPE";
  const isMaintenance =
    (booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE";
  const isWarranty = (booking?.type || "").toUpperCase() === "WARRANTY_TYPE";
  const isCampaign = (booking?.type || "").toUpperCase() === "CAMPAIGN_TYPE";

  const chassisNumber = booking?.vehicle?.chassisNumber || "";
  const chassisConfirmed = !!chassisNumber;

  useEffect(() => {
    if (!booking) return;

    if (initialEVCheckId) {
      setEvCheckId(initialEVCheckId);
      return;
    }

    if (booking?.id) {
      const loadData = async () => {
        setLoading(true);
        try {
          const res = await fetchEVCheckByAppointmentService(booking.id);

          let checkId = null;
          let checkStatus = null;
          let odometerValue = null;

          const list =
            res?.data?.rowDatas ||
            res?.rowDatas ||
            (Array.isArray(res) ? res : []);

          if (Array.isArray(list) && list.length > 0) {
            const latest = list[list.length - 1];
            checkId = latest?.id;
            checkStatus = latest?.status || null;
            odometerValue = latest?.odometer ?? null;
          } else if (res?.id) {
            checkId = res.id;
            checkStatus = res.status || null;
            odometerValue = res.odometer ?? null;
          }

          if (checkId) {
            setEvCheckId(checkId);
            if (checkStatus) setEvCheckStatus(checkStatus);

            const hasKm =
              typeof odometerValue === "number"
                ? odometerValue > 0
                : !!odometerValue;

            setHasOdometer(hasKm || (km && km.trim() !== ""));

            if (hasKm && odometerValue != null) {
              setKm(String(odometerValue));
            } else if (!km || km.trim() === "") {
              setKm("");
            }
          } else {
            setHasOdometer(false);
            if (isMaintenance) {
              toast.info(
                "Chưa có EV Check. Vui lòng gán kỹ thuật viên / tạo EVCheck trước."
              );
            } else {
              toast.info("Chưa có EVCheck. Hãy gán kỹ thuật viên trước.");
            }
          }
        } catch (err) {
          toast.error(
            err?.response?.data?.message ||
              err?.data?.message ||
              err?.message ||
              "Không thể tải EV Check!"
          );
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [booking, initialEVCheckId, refreshKey]);

  const handleSendKm = async () => {
    if (!km && km !== 0) return toast.error("Vui lòng nhập số KM!");
    const odometerNumber = Number(km);
    try {
      setLoading(true);
      const loadingToast = toast.loading("Đang cập nhật số KM...");

      if (!evCheckId)
        throw new Error(
          "EVCheck chưa được tạo. Vui lòng gán kỹ thuật viên trước!"
        );

      const payload = {
        odometer: odometerNumber,
        vehicleId: booking.vehicle?.id || booking.customerVehicle?.id,
        type: booking.type,
      };

      await updateEVCheckService(evCheckId, payload);
      toast.dismiss(loadingToast);
      toast.success("Cập nhật số KM thành công!");

      setHasOdometer(true);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(
        err?.response?.data?.message ||
          err?.data?.message ||
          err?.message ||
          "Không thể cập nhật số KM!"
      );
    } finally {
      setLoading(false);
    }
  };

  if (bookingsLoading || loading) {
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}>
        <Loading />
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#999" }}>Không tìm thấy lịch hẹn</p>
            <Button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  navigate("/technician/vehicles");
                }
              }}
              style={{ marginTop: 16 }}>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, width: "100%" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
        <Button
          icon={<ArrowLeft size={16} />}
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              navigate("/technician/vehicles");
            }
          }}
          style={{ color: UI_COLORS.PRIMARY_RED }}>
          Quay lại
        </Button>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: "#c41e0e",
          }}>
          Chi tiết lịch hẹn: {booking.code}
        </h2>
      </div>

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
          <Hash size={16} color='#d4380d' />
          Thông tin chung
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px 32px",
          }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
              }}>
              <Space size={8}>
                <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                  Mã lịch hẹn:
                </Text>
              </Space>
              <Text
                strong
                style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                {booking.code || ""}
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
              }}>
              <Space size={8}>
                <Calendar size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                  Ngày hẹn:
                </Text>
              </Space>
              <Text
                strong
                style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
              }}>
              <Space size={8}>
                <Clock size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                  Thời gian:
                </Text>
              </Space>
              <Text
                strong
                style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                {booking.slotTime
                  ? (() => {
                      const [start, end] = booking.slotTime
                        .replace("H", "")
                        .split("_");
                      return `${start}:00-${end}:00`;
                    })()
                  : ""}
              </Text>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "12px",
                }}>
                <Space size={8}>
                  <Clock size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                  <Text
                    type='secondary'
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      minWidth: "100px",
                    }}>
                    Thời gian check-in:
                  </Text>
                </Space>
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    color: booking.checkedInAt ? "#52c41a" : "#ff4d4f",
                  }}>
                  {booking.checkedInAt
                    ? new Date(booking.checkedInAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Chưa check-in"}
                </Text>
              </div>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
              }}>
              <Space size={8}>
                <User size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                  Khách hàng:
                </Text>
              </Space>
              <Text
                strong
                style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                {`${booking.customer?.firstName || ""} ${
                  booking.customer?.lastName || ""
                }`.trim() || ""}
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
              }}>
              <Space size={8}>
                <Building size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                  Trung tâm dịch vụ:
                </Text>
              </Space>
              <Text
                strong
                style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                {booking.serviceCenter?.name || ""}
              </Text>
            </div>

            {(booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE" &&
              booking.maintenanceStage?.name && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <Space size={8}>
                    <Wrench
                      size={16}
                      style={{ color: UI_COLORS.PRIMARY_RED }}
                    />
                    <Text
                      type='secondary'
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: "100px",
                      }}>
                      Giai đoạn bảo dưỡng:
                    </Text>
                  </Space>
                  <Text
                    strong
                    style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                    {booking.maintenanceStage?.name || ""}
                  </Text>
                </div>
              )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
              }}>
              <Space size={8}>
                <Wrench size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 14, fontWeight: 600, minWidth: "100px" }}>
                  Loại dịch vụ:
                </Text>
              </Space>
              <Tag
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 12,
                  ...(isMaintenance
                    ? {
                        backgroundColor: "#e6f7ff",
                        color: "#0050b3",
                        border: "1px solid #91d5ff",
                      }
                    : isRepair
                    ? {
                        backgroundColor: "#f9f0ff",
                        color: "#531dab",
                        border: "1px solid #d3adf7",
                      }
                    : isWarranty
                    ? {
                        backgroundColor: "#f6ffed",
                        color: "#389e0d",
                        border: "1px solid #b7eb8f",
                      }
                    : isCampaign
                    ? {
                        backgroundColor: "#fff7e6",
                        color: "#d46b08",
                        border: "1px solid #ffd591",
                      }
                    : {
                        backgroundColor: "#fafafa",
                        color: "#595959",
                        border: "1px solid #d9d9d9",
                      }),
                }}>
                {isMaintenance
                  ? "Bảo dưỡng"
                  : isRepair
                  ? "Sửa chữa"
                  : isWarranty
                  ? "Bảo hành"
                  : isCampaign
                  ? "Chiến dịch"
                  : ""}
              </Tag>
            </div>

            {booking.note && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "12px",
                }}>
                <Space size={8}>
                  <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                  <Text
                    type='secondary'
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      minWidth: "100px",
                    }}>
                    Ghi chú:
                  </Text>
                </Space>
                <Text
                  strong
                  style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                  {booking.note}
                </Text>
              </div>
            )}
          </div>
        </div>
      </Card>

      {booking.vehicle && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: "1px solid #e8e8e8",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          headStyle={{
            borderBottom: "1px solid #f0f0f0",
            padding: "20px 24px",
            background: "#fafafa",
            borderRadius: "12px 12px 0 0",
          }}
          bodyStyle={{ padding: "24px" }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Car size={18} style={{ color: UI_COLORS.PRIMARY_RED }} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: UI_COLORS.PRIMARY_RED_DARK,
                }}>
                Thông tin phương tiện
              </span>
            </div>
          }>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "24px 32px",
            }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(booking.vehicle.modelName || booking.vehicle.model?.name) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <Space size={8}>
                    <Car size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                    <Text
                      type='secondary'
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: "100px",
                      }}>
                      Mẫu xe:
                    </Text>
                  </Space>
                  <Text
                    strong
                    style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                    {booking.vehicle.modelName || booking.vehicle.model?.name}
                  </Text>
                </div>
              )}

              {booking.vehicle.engineNumber && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <Space size={8}>
                    <Wrench
                      size={16}
                      style={{ color: UI_COLORS.PRIMARY_RED }}
                    />
                    <Text
                      type='secondary'
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: "100px",
                      }}>
                      Số máy:
                    </Text>
                  </Space>
                  <Text
                    strong
                    style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                    {booking.vehicle.engineNumber}
                  </Text>
                </div>
              )}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {chassisNumber && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <Space size={8}>
                    <Hash size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                    <Text
                      type='secondary'
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: "100px",
                      }}>
                      Số khung (VIN):
                    </Text>
                  </Space>
                  <Tag
                    color={UI_COLORS.TAG_RED}
                    style={{
                      borderRadius: 6,
                      padding: "4px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "none",
                    }}>
                    {chassisNumber}
                  </Tag>
                </div>
              )}

              {translateColor(booking.vehicle.color) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <Space size={8}>
                    <Palette
                      size={16}
                      style={{ color: UI_COLORS.PRIMARY_RED }}
                    />
                    <Text
                      type='secondary'
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: "100px",
                      }}>
                      Màu sắc:
                    </Text>
                  </Space>
                  <Tag
                    style={{
                      borderRadius: 6,
                      padding: "4px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "none",
                      backgroundColor: getColorHex(booking.vehicle.color),
                      color: booking.vehicle.color?.toUpperCase() === "WHITE" || booking.vehicle.color?.toUpperCase() === "YELLOW" || booking.vehicle.color?.toUpperCase() === "GOLD" ? "#000000" : "#ffffff",
                    }}>
                    {translateColor(booking.vehicle.color)}
                  </Tag>
                </div>
              )}

              {isMaintenance && hasOdometer && km && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                  <Space size={8}>
                    <Gauge size={16} style={{ color: UI_COLORS.PRIMARY_RED }} />
                    <Text
                      type='secondary'
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: "100px",
                      }}>
                      Số KM đã đi:
                    </Text>
                  </Space>
                  <Text
                    strong
                    style={{ fontSize: 14, color: UI_COLORS.TEXT_PRIMARY }}>
                    {Number(km).toLocaleString("vi-VN")} km
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {isMaintenance &&
        evCheckId &&
        !hasOdometer &&
        !readOnly &&
        evCheckStatus !== "REPAIR_IN_PROGRESS" &&
        evCheckStatus !== "INSPECTION_COMPLETED" &&
        evCheckStatus !== "QUOTE_APPROVED" &&
        evCheckStatus !== "REPAIR_COMPLETED" &&
        evCheckStatus !== "COMPLETED" && (
          <Card
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: "24px" }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 16,
                color: UI_COLORS.PRIMARY_RED_DARK,
                borderBottom: `1px solid ${UI_COLORS.BORDER_LIGHT}`,
                paddingBottom: 12,
              }}>
              Cập nhật số km xe đã đi
            </h3>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <Input
                type='number'
                placeholder='Nhập số km'
                value={km}
                onChange={(e) => setKm(e.target.value)}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                type='primary'
                danger
                loading={loading}
                onClick={handleSendKm}
                style={{ backgroundColor: "#ff4d4f" }}>
                Cập nhật KM
              </Button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
              EVCheck đã được tạo, nhưng chưa có số KM. Vui lòng nhập KM để hệ
              thống sinh hạng mục bảo dưỡng.
            </p>
          </Card>
        )}

      {isMaintenance && !evCheckId && (
        <Card
          style={{ marginBottom: 24, borderRadius: 8 }}
          bodyStyle={{ padding: "24px", textAlign: "center" }}>
          <p style={{ color: "#999", fontStyle: "italic" }}>
            Chưa tìm thấy EV Check cho lịch hẹn này. Vui lòng gán kỹ thuật viên
            / tạo EVCheck trước.
          </p>
        </Card>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}>
          <Loading />
        </div>
      ) : isRepair && chassisConfirmed ? (
        <Card
          style={{ marginBottom: 24, borderRadius: 8 }}
          bodyStyle={{ padding: "24px", maxHeight: "600px", overflow: "auto" }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: UI_COLORS.PRIMARY_RED_DARK,
              borderBottom: `1px solid ${UI_COLORS.BORDER_LIGHT}`,
              paddingBottom: 12,
            }}>
            Phiếu sửa chữa
          </h3>

          {(() => {
            const note = (booking?.note || "").toLowerCase();
            const isRMABooking =
              note.includes("lịch thay") && note.includes("rma");
            return isRMABooking ? (
              <RMARepairModeEVCheck
                key={`rma-repair-${evCheckId || "empty"}-${refreshKey}`}
                booking={booking}
                evCheckId={evCheckId}
                onRefresh={() => setRefreshKey((prev) => prev + 1)}
                readOnly={readOnly}
                forceEmpty={!evCheckId}
              />
            ) : (
              <RepairModeEVCheck
                key={`repair-${evCheckId || "empty"}-${refreshKey}`}
                booking={booking}
                evCheckId={evCheckId}
                onRefresh={() => setRefreshKey((prev) => prev + 1)}
                readOnly={readOnly}
                forceEmpty={!evCheckId}
              />
            );
          })()}
        </Card>
      ) : isCampaign ? (
        <Card
          style={{ marginBottom: 24, borderRadius: 8 }}
          bodyStyle={{ padding: "24px", maxHeight: "600px", overflow: "auto" }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: UI_COLORS.PRIMARY_RED_DARK,
              borderBottom: `1px solid ${UI_COLORS.BORDER_LIGHT}`,
              paddingBottom: 12,
            }}>
            Phiếu kiểm tra chiến dịch
          </h3>
          <CampaignModeEVCheck
            key={`campaign-${evCheckId || "empty"}-${refreshKey}`}
            booking={booking}
            evCheckId={evCheckId}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
            readOnly={readOnly}
            forceEmpty={!evCheckId}
          />
        </Card>
      ) : isMaintenance && evCheckId && (hasOdometer || readOnly) ? (
        <Card
          style={{ marginBottom: 24, borderRadius: 8 }}
          bodyStyle={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: UI_COLORS.PRIMARY_RED_DARK,
              borderBottom: `1px solid ${UI_COLORS.BORDER_LIGHT}`,
              paddingBottom: 12,
            }}>
            {evCheckStatus === "REPAIR_IN_PROGRESS"
              ? "Tiến hành sửa chữa"
              : "Kết quả kiểm tra EVCheck"}
          </h3>
          <MaintenanceModeEVCheck
            key={`${evCheckId}-${evCheckStatus}-${refreshKey}`}
            booking={booking}
            evCheckId={evCheckId}
            evCheckStatus={evCheckStatus}
            setEvCheckStatus={setEvCheckStatus}
            readOnly={readOnly}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
          />
        </Card>
      ) : null}

      <Divider />
    </div>
  );
}
