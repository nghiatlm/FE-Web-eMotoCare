import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";
import { Button, Tag, Divider, Select, Card, Spin } from "antd";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { fetchTechnicians } from "../../services/staffsService";
import TechnicianBookingDetailDrawer from "../../components/technician/TechnicanBookingDetailDrawer";
import {
  changeAppointmentStatusService,
  approveAppointmentService,
} from "../../services/appointmentService";

import {
  createEVCheckService,
  fetchEVCheckByAppointmentService,
} from "../../services/evcheckService";

import Payment from "../../components/service-staff/Payment";
import PaymentInfo from "../../components/service-staff/PaymentInfo";
import { useBookings } from "../../hooks/useBookings";

export default function StaffBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, updateStatus } = useBookings();
  
  // Tìm booking từ danh sách đã có
  const booking = data.find(b => b.id === id);
  
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [currentEVCheckId, setCurrentEVCheckId] = useState(null);
  const [showTechnicianDrawer, setShowTechnicianDrawer] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [technicianFromEVCheck, setTechnicianFromEVCheck] = useState(null);

  const status = booking?.status?.toUpperCase();
  
  // ✅ Lấy technician từ booking hoặc từ EVCheck
  const currentTechnician = booking?.technician || technicianFromEVCheck;

  useEffect(() => {
    const loadTechs = async () => {
      if (status !== "CHECKED_IN") return;

      try {
        setLoadingTechs(true);
        const list = await fetchTechnicians();
        setTechnicians(list);
      } catch {
        toast.error("Không thể tải danh sách kỹ thuật viên");
      } finally {
        setLoadingTechs(false);
      }
    };

    if (booking) {
      loadTechs();
      setSelectedTechnician(null);
    }
  }, [booking, status]);

  useEffect(() => {
    const loadEV = async () => {
      if (!booking?.id) return;

      try {
        const evCheck = await fetchEVCheckByAppointmentService(booking.id);
        if (evCheck) {
          setCurrentEVCheckId(evCheck.id);
          // ✅ Lấy technician từ evCheck nếu có
          const tech = evCheck.taskExecutor || evCheck.technician || null;
          if (tech) {
            setTechnicianFromEVCheck(tech);
          }
        }
      } catch {}
    };

    if (booking) loadEV();
  }, [booking]);

  // ✅ Hiển thị loading khi đang load dữ liệu
  if (loading) {
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
            <Button onClick={() => navigate("/staff/booking/list")} style={{ marginTop: 16 }}>
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleAssignTechnician = async () => {
    if (!selectedTechnician)
      return toast.warning("Vui lòng chọn kỹ thuật viên");

    try {
      const payload = {
        appointmentId: booking.id,
        taskExecutorId: selectedTechnician.id,
      };

      const res = await createEVCheckService(payload);
      const evCheckId = res?.id || res?.data?.id;
      if (evCheckId) {
        setCurrentEVCheckId(evCheckId);
        setTechnicianFromEVCheck(selectedTechnician); // ✅ Cập nhật technician ngay lập tức
      }

      if (status === "APPROVED") {
        await changeAppointmentStatusService(booking.id, "CHECKED_IN");
        updateStatus(booking.id, "CHECKED_IN", selectedTechnician);
      } else {
        updateStatus(booking.id, booking.status, selectedTechnician);
      }

      toast.success("Đã gán kỹ thuật viên và tạo EVCheck!");
    } catch (error) {
      console.error("Lỗi gán kỹ thuật viên:", error);
      toast.error(error.message || "Không thể gán kỹ thuật viên!");
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      if (newStatus === "APPROVED") {
        await approveAppointmentService(booking.id);
      } else {
        await changeAppointmentStatusService(booking.id, newStatus);
      }

      toast.success(`Cập nhật trạng thái: ${STATUS_MAP[newStatus]}`);
      updateStatus(booking.id, newStatus, booking.technician);
      navigate("/staff/booking/list");
    } catch (e) {
      toast.error(e.message || "Không thể cập nhật trạng thái!");
    }
  };

  const handleManualCheckIn = async () => {
    if (!booking.checkinQRCode) {
      toast.error("Lịch hẹn chưa có mã QR check-in!");
      return;
    }

    try {
      await changeAppointmentStatusService(booking.id, "CHECKED_IN", {
        code: booking.code,
        checkinQRCode: booking.checkinQRCode,
      });

      toast.success("Check-in thành công!");
      updateStatus(booking.id, "CHECKED_IN");
    } catch (error) {
      console.error("Lỗi check-in:", error);
      toast.error(error.message || "Check-in thất bại!");
    }
  };

  return (
    <>
      <div style={{ padding: 24, width: "100%", background: "#fff7f3", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/staff/booking/list")}
            style={{ color: "#ff4d4f" }}
          >
            Quay lại
          </Button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#c41e0e" }}>
              Chi tiết lịch hẹn: {booking.code}
            </h2>
            <Tag
              color={STATUS_COLORS[status]}
              style={{ fontSize: 14, padding: "4px 12px" }}>
              {STATUS_MAP[status] || status}
            </Tag>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* GENERAL INFO */}
          <Card
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
              Thông tin chung
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              <p style={{ margin: 0 }}>
                <strong>Mã lịch hẹn:</strong> {booking.code}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Người đặt:</strong> {booking.customer?.firstName}{" "}
                {booking.customer?.lastName}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Ngày hẹn:</strong>{" "}
                {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Trung tâm DV:</strong> {booking.serviceCenter?.name}
              </p>
            </div>
          </Card>

          {/* QR CODE DISPLAY */}
          {status === "APPROVED" && booking.checkinQRCode && (
            <Card
              style={{ marginBottom: 24, borderRadius: 8 }}
              bodyStyle={{ padding: "24px", textAlign: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                Mã QR Check-in
              </h3>
              <img
                src={booking.checkinQRCode}
                alt='QR Check-in'
                style={{ width: 200, margin: "0 auto", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              />
              <p style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
                Khách dùng mã này để thực hiện check-in tại quầy.
              </p>

              <div style={{ marginTop: 24 }}>
                <Button
                  type='primary'
                  size='large'
                  danger
                  onClick={handleManualCheckIn}
                  style={{ minWidth: 200 }}>
                  Check-in ngay
                </Button>
              </div>
            </Card>
          )}

          {/* ASSIGN TECHNICIAN */}
          {status === "CHECKED_IN" && !currentTechnician && (
            <Card
              style={{ marginBottom: 24, borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                Chọn kỹ thuật viên
              </h3>
              <Select
                style={{ width: "100%" }}
                placeholder='Chọn kỹ thuật viên'
                loading={loadingTechs}
                value={selectedTechnician?.id}
                options={technicians.map((t) => ({
                  value: t.id,
                  label: `${t.firstName} ${t.lastName}`,
                }))}
                onChange={(value) =>
                  setSelectedTechnician(technicians.find((t) => t.id === value))
                }
              />
              <Button
                type='primary'
                style={{ marginTop: 16 }}
                onClick={handleAssignTechnician}>
                Xác nhận kỹ thuật viên
              </Button>
            </Card>
          )}

          {currentTechnician && (
            <Card
              style={{ marginBottom: 24, borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
                Kỹ thuật viên phụ trách
              </h3>
              <p style={{ margin: 0 }}>
                <strong>Tên:</strong> {currentTechnician.firstName}{" "}
                {currentTechnician.lastName}
              </p>
            </Card>
          )}

          <Card
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#d4380d", borderBottom: "1px solid #f0f0f0", paddingBottom: 12 }}>
              Kết quả kiểm tra EVCheck
            </h3>
            {!currentTechnician ? (
              <div style={{ textAlign: "center", color: "#999", padding: "20px 0" }}>
                Kỹ thuật viên chưa thực hiện kiểm tra.
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type='primary'
                  onClick={() => setShowTechnicianDrawer(true)}>
                  Xem chi tiết EVCheck
                </Button>
              </div>
            )}
          </Card>

          {/* Thông tin thanh toán */}
          {(status === "REPAIR_COMPLETED" || status === "COMPLETED" || status === "QUOTE_APPROVED") && currentTechnician && (
            <div style={{ marginBottom: 24 }}>
              <PaymentInfo
                booking={booking}
                onOpenPayment={() => setIsPaymentModalOpen(true)}
              />
            </div>
          )}

          <Divider />

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {status === "PENDING" && (
              <>
                <Button danger onClick={() => handleChangeStatus("CANCELED")}>
                  Từ chối
                </Button>
                <Button
                  type='primary'
                  onClick={() => handleChangeStatus("APPROVED")}
                  style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}>
                  Chấp nhận
                </Button>
              </>
            )}
            {status === "REPAIR_COMPLETED" && (
              <Button
                type='primary'
                onClick={() => setIsPaymentModalOpen(true)}
                style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}>
                Hoàn tất / Thanh toán
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <TechnicianBookingDetailDrawer
        booking={booking}
        open={showTechnicianDrawer}
        onClose={() => setShowTechnicianDrawer(false)}
        initialEVCheckId={currentEVCheckId}
        readOnly
      />

      <Payment
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={booking}
      />
    </>
  );
}

