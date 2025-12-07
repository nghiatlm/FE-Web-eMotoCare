// src/pages/technician/TechnicianBookingDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RepairModeEVCheck from "../../components/technician/detail-content/RepairModeEVCheck";
import RMARepairModeEVCheck from "../../components/technician/detail-content/RMARepairModeEVCheck";
import MaintenanceModeEVCheck from "../../components/technician/detail-content/MaintenanceModeEVCheck";
import CampaignModeEVCheck from "../../components/technician/detail-content/CampaignModeEVCheck";
import {
  SERVICE_TYPE_MAP,
  SERVICE_TYPE_COLORS,
} from "../../utils/constants.js";

import { Card, Divider, Button, Input, Spin } from "antd";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

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
  
  // ✅ Lấy bookingId từ params hoặc props
  const bookingId = propBookingId || params.id;
  
  // ✅ Tìm booking từ danh sách đã có
  const booking = data.find(b => b.id === bookingId);
  
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

  // LẤY SỐ KHUNG TỪ BOOKING.VEHICLE → TỰ ĐỘNG XÁC NHẬN
  const chassisNumber = booking?.vehicle?.chassisNumber || "";
  const chassisConfirmed = !!chassisNumber;

  // ======== LOAD EV CHECK ========
  useEffect(() => {
    if (!booking) return; // ✅ Đợi booking có trước
    
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

            // ✅ Kiểm tra odometer: nếu là số thì > 0, nếu là string thì không rỗng
            const hasKm =
              typeof odometerValue === "number"
                ? odometerValue > 0
                : !!odometerValue;

            // ✅ Chỉ set hasOdometer = false nếu thực sự chưa có odometer
            // Nếu đã từng có odometer (km state đã có giá trị) thì giữ nguyên
            setHasOdometer(hasKm || (km && km.trim() !== ""));
            
            // ✅ Chỉ set km nếu có odometerValue từ API, không reset nếu đã có giá trị
            if (hasKm && odometerValue != null) {
              setKm(String(odometerValue));
            } else if (!km || km.trim() === "") {
              // Chỉ reset km nếu chưa có giá trị
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
          console.error("Lỗi tải EV Check:", err);
          toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải EV Check!"));
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, initialEVCheckId, refreshKey]);

  // ======== CẬP NHẬT KM (Maintenance) – CHỈ DÙNG CHO TECHNICIAN =========
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
      console.error("Lỗi cập nhật KM:", err);
      toast.dismiss(loadingToast);
      toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể cập nhật số KM!"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hiển thị loading khi đang load dữ liệu
  if (bookingsLoading || loading) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  // ✅ Chỉ hiển thị "Không tìm thấy" khi đã load xong mà không có dữ liệu
  if (!booking) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#999" }}>Không tìm thấy lịch hẹn</p>
            <Button onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate("/technician/vehicles");
              }
            }} style={{ marginTop: 16 }}>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          icon={<ArrowLeft size={16} />}
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              navigate("/technician/vehicles");
            }
          }}
          style={{ color: "#ff4d4f" }}
        >
          Quay lại
        </Button>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#c41e0e" }}>
          Chi tiết lịch hẹn: {booking.code}
        </h2>
      </div>

      {/* THÔNG TIN CHUNG */}
      <Card
        style={{ marginBottom: 24, borderRadius: 8 }}
        bodyStyle={{ padding: "24px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
          Thông tin chung
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div>
            <strong>Mã lịch hẹn:</strong> {booking.code || "—"}
          </div>
          <div>
            <strong>Khách hàng:</strong> {booking.customer?.firstName}{" "}
            {booking.customer?.lastName}
          </div>
          <div>
            <strong>Ngày hẹn:</strong>{" "}
            {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
          </div>
          <div>
            <strong>Thời gian:</strong>{" "}
            {booking.slotTime ? (() => {
              const [start, end] = booking.slotTime.replace("H", "").split("_");
              return `${start}:00-${end}:00`;
            })() : "—"}
          </div>
          <div>
            <strong>Trung tâm dịch vụ:</strong> {booking.serviceCenter?.name || ""}
          </div>
          {(booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE" && (
            <div>
              <strong>Giai đoạn bảo dưỡng:</strong> {booking.maintenanceStage?.name || ""}
            </div>
          )}
          <div>
            <strong>Loại dịch vụ:</strong>{" "}
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 12,
                ...(isMaintenance
                  ? { backgroundColor: "#e6f7ff", color: "#0050b3", border: "1px solid #91d5ff" }
                  : isRepair
                  ? { backgroundColor: "#f9f0ff", color: "#531dab", border: "1px solid #d3adf7" }
                  : isWarranty
                  ? { backgroundColor: "#f6ffed", color: "#389e0d", border: "1px solid #b7eb8f" }
                  : isCampaign
                  ? { backgroundColor: "#fff7e6", color: "#d46b08", border: "1px solid #ffd591" }
                  : { backgroundColor: "#fafafa", color: "#595959", border: "1px solid #d9d9d9" }),
              }}>
              {isMaintenance
                ? "Bảo dưỡng"
                : isRepair
                ? "Sửa chữa"
                : isWarranty
                ? "Bảo hành"
                : isCampaign
                ? "Chiến dịch"
                : "—"}
            </span>
          </div>
          {booking.note && (
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Ghi chú:</strong> {booking.note}
            </div>
          )}
          {isRepair && chassisNumber && (
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Số khung (VIN):</strong>{" "}
              <code style={{ backgroundColor: "#f5f5f5", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                {chassisNumber}
              </code>
            </div>
          )}
        </div>
      </Card>

      {/* ==== NHẬP KM – CHỈ KỸ THUẬT VIÊN THẤY (readOnly = false) ==== */}
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
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
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
            <Button type='primary' loading={loading} onClick={handleSendKm}>
              Cập nhật KM
            </Button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
            EVCheck đã được tạo, nhưng chưa có số KM. Vui lòng nhập KM để hệ
            thống sinh hạng mục bảo dưỡng.
          </p>
        </Card>
      )}

      {/* NẾU MAINTENANCE MÀ CHƯA CÓ EVCheckID LUÔN */}
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

      {/* NỘI DUNG CHÍNH */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Spin />
        </div>
      ) : isRepair && chassisConfirmed ? (
        <Card
          style={{ marginBottom: 24, borderRadius: 8 }}
          bodyStyle={{ padding: "24px", maxHeight: "600px", overflow: "auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
            Phiếu sửa chữa
          </h3>
          {/* ✅ Kiểm tra note: nếu có "lịch thay" và "rma" thì dùng RMARepairModeEVCheck */}
          {(() => {
            const note = (booking?.note || "").toLowerCase();
            const isRMABooking = note.includes("lịch thay") && note.includes("rma");
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
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
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
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
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

