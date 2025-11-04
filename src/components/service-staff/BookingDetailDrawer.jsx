import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";
import { Drawer, Button, Tag, Divider, Select, message } from "antd";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchTechnicians } from "../../services/staffsService";
import MaintenanceContent from "./detail-content/MaintenanceContent";
import RepairContent from "./detail-content/RepairContent";
import WarrantyContent from "./detail-content/WarrantyContent";
import RecallContent from "./detail-content/RecallContent";
import QRModal from "./QRModal";
import {
  assignAppointmentTechnicianService,
  fetchCheckinCodeService,
  checkinByCodeService,
  changeAppointmentStatusService,
} from "../../services/appointmentService";
import { createEVCheckService } from "../../services/evcheckService";

const renderServiceContent = (serviceType, booking) => {
  if (!booking.technician) {
    return (
      <div className='text-center py-8 text-gray-500 italic'>
        <p> Kỹ thuật viên chưa thực hiện kiểm tra.</p>
      </div>
    );
  }
  switch (serviceType?.toUpperCase()) {
    case "MAINTENANCE_TYPE":
      return <MaintenanceContent booking={booking} />;
    case "REPAIR_TYPE":
      return <RepairContent booking={booking} />;
    case "WARRANTY_TYPE":
      return <WarrantyContent booking={booking} />;
    case "RECALL_TYPE":
      return <RecallContent booking={booking} />;
    default:
      return (
        <div className='text-gray-500'>Không có dữ liệu dịch vụ phù hợp</div>
      );
  }
};

export default function BookingDetailDrawer({
  booking,
  open,
  onClose,
  onUpdateStatus,
}) {
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  // Thêm state trong component cha
  const [showTechnicianDrawer, setShowTechnicianDrawer] = useState(false);
  const [currentEVCheckId, setCurrentEVCheckId] = useState(null);

  const status = booking?.status?.toUpperCase();

  useEffect(() => {
    const loadTechnicians = async () => {
      if (status !== "CHECKED_IN") return;
      try {
        setLoadingTechs(true);
        const list = await fetchTechnicians();
        setTechnicians(list);
      } catch (error) {
        message.error("Không thể tải danh sách kỹ thuật viên");
      } finally {
        setLoadingTechs(false);
      }
    };

    if (open) {
      loadTechnicians();
      setSelectedTechnician(null);
      setIsQRModalOpen(false);
      setQrValue(null);
      setCheckedIn(false);
    }
  }, [open, status]);

  if (!booking) return null;

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      message.warning("Vui lòng chọn kỹ thuật viên");
      return;
    }

    try {
      const payload = {
        appointmentId: booking.id,
        taskExecutorId: selectedTechnician.id,
      };

      const newEVCheck = await createEVCheckService(payload);

      message.success("Đã gán kỹ thuật viên và tạo EVCheck!");

      onUpdateStatus?.(booking.id, "CHECKED_IN", selectedTechnician);

      // BƯỚC 3: MỞ DRAWER NHẬP KM NGAY
      setCurrentEVCheckId(newEVCheck.id); // Lưu ID để drawer dùng
      setShowTechnicianDrawer(true); // Mở drawer
    } catch (error) {
      console.error("Lỗi gán kỹ thuật viên:", error);
      message.error(error.message || "Không thể gán kỹ thuật viên!");
    }
  };

  const handleShowQRCode = async () => {
    try {
      const code = await fetchCheckinCodeService(booking.id);
      setQrValue(code);
      setIsQRModalOpen(true);
      message.success("Đã lấy mã check-in thành công.");
    } catch (error) {
      console.error(error);
      message.error(error.message || "Không thể lấy mã check-in");
    }
  };

  const handleCheckin = async () => {
    if (!qrValue) {
      message.warning("Vui lòng lấy mã QR trước khi Check-in.");
      return;
    }
    try {
      await checkinByCodeService(qrValue);
      message.success("Check-in thành công!");

      onUpdateStatus?.(booking.id, "CHECKED_IN", null);
      setIsQRModalOpen(false);
      setQrValue(null);
    } catch (error) {
      console.error(error);
      message.error(error.message || "Check-in thất bại!");
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      await changeAppointmentStatusService(booking.id, newStatus);
      message.success(
        `Cập nhật trạng thái: ${STATUS_MAP[newStatus] || newStatus}`
      );
      onUpdateStatus?.(booking.id, newStatus, booking.technician);
      onClose();
    } catch (error) {
      console.error(error);
      message.error(error.message || "Không thể cập nhật trạng thái!");
    }
  };

  return (
    <>
      <Drawer
        title={
          <div className='flex justify-between items-center'>
            <span className='font-semibold text-lg text-[#c41e0e]'>
              Chi tiết booking: {booking.code}
            </span>
            <Tag
              color={STATUS_COLORS[status]}
              className='text-sm px-3 py-1 rounded-full uppercase'>
              {STATUS_MAP[status] || status}
            </Tag>
          </div>
        }
        width='80%'
        open={open}
        onClose={onClose}
        bodyStyle={{
          background: "#fff7f3",
          paddingBottom: 80,
          borderRadius: "12px",
        }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          {/* Thông tin chung */}
          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
            <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
              🧾 Thông tin chung
            </h3>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700'>
              <p>
                <strong>Mã lịch hẹn:</strong> {booking.code || "—"}
              </p>
              <p>
                <strong>Người đặt:</strong>{" "}
                {[booking.customer?.firstName, booking.customer?.lastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </p>
              <p>
                <strong>CCCD:</strong> {booking.customer?.citizenId || "—"}
              </p>
              <p>
                <strong>Giới tính:</strong>{" "}
                {booking.customer?.gender === "MALE"
                  ? "Nam"
                  : booking.customer?.gender === "FEMALE"
                  ? "Nữ"
                  : "—"}
              </p>
              <p>
                <strong>Địa chỉ KH:</strong> {booking.customer?.address || "—"}
              </p>
              <p>
                <strong>Ngày hẹn:</strong>{" "}
                {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
              </p>
              <p>
                <strong>Khung giờ:</strong> {booking.timeSlot || "—"}
              </p>

              <p>
                <strong>Loại dịch vụ:</strong>{" "}
                <span
                  className={`
                        inline-block px-3 py-1 text-xs font-semibold rounded-full 
                        ${
                          booking.type === "MAINTENANCE_TYPE"
                            ? "bg-blue-100 text-blue-800 border border-blue-300" // Màu xanh cho Bảo dưỡng
                            : "bg-purple-100 text-purple-800 border border-purple-300" // Màu tím cho các loại khác
                        }
                    `}>
                  {booking.type === "MAINTENANCE_TYPE"
                    ? "Bảo dưỡng"
                    : booking.type}
                </span>
              </p>

              <p>
                <strong>Trung tâm DV:</strong>{" "}
                {booking.serviceCenter?.name || "—"}
              </p>
              <p>
                <strong>Địa chỉ trung tâm:</strong>{" "}
                {booking.serviceCenter?.address || "—"}
              </p>
            </div>
          </section>

          {/* Check-in */}
          {status === "APPROVED" && (
            <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
              <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
                🔑 Thực hiện Check-in
              </h3>
              <Button
                type='primary'
                onClick={handleShowQRCode}
                className='w-full'>
                Mở Mã QR Check-in
              </Button>

              {qrValue && (
                <div className='mt-3'>
                  <p className='text-xs text-gray-500 mb-1'>
                    Hoặc sử dụng mã này để check-in thủ công:
                  </p>
                  <Button
                    type='default'
                    onClick={handleCheckin}
                    className='w-full'>
                    Check-in bằng mã: {qrValue}
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Gán kỹ thuật viên sau khi check-in */}
          {status === "CHECKED_IN" && !booking.technician && (
            <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
              <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
                👨‍🔧 Chọn kỹ thuật viên
              </h3>
              <Select
                style={{ width: "100%" }}
                placeholder='Chọn kỹ thuật viên phụ trách'
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
              {selectedTechnician && (
                <div className='mt-4 bg-[#fff8f0] p-4 rounded-lg border border-[#ffd9c2]'>
                  <p>
                    <strong>Tên:</strong>{" "}
                    {`${selectedTechnician.firstName} ${selectedTechnician.lastName}`}
                  </p>
                  <p>
                    <strong>SĐT:</strong> {selectedTechnician.phone || "—"}
                  </p>
                  <p>
                    <strong>Chuyên môn:</strong>{" "}
                    {selectedTechnician.specialty || "Không rõ"}
                  </p>
                </div>
              )}
              <Button
                type='primary'
                className='mt-4 bg-[#d4380d]]'
                disabled={!selectedTechnician || loadingTechs}
                onClick={handleAssignTechnician}>
                Xác nhận gán kỹ thuật viên
              </Button>
            </section>
          )}

          {/* Thông tin technician nếu đã gán */}
          {booking.technician && (
            <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
              <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
                👨‍🔧 Kỹ thuật viên phụ trách
              </h3>
              <div className='grid grid-cols-2 gap-y-2 text-sm text-gray-700'>
                <p>
                  <strong>Tên:</strong>{" "}
                  {booking.technician.name ||
                    `${booking.technician.firstName} ${booking.technician.lastName}`}
                </p>
                <p>
                  <strong>SĐT:</strong> {booking.technician.phone}
                </p>
                <p>
                  <strong>Chuyên môn:</strong> {booking.technician.specialty}
                </p>
              </div>
            </section>
          )}

          {/* Nội dung công việc */}
          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border border-[#ffd9c2]'>
            <h3 className='font-semibold text-base mb-3 border-b pb-2 text-[#d4380d]'>
              📋 Nội dung công việc
            </h3>
            {renderServiceContent(booking.type, booking)}
          </section>

          <Divider />

          {/* Nút thay đổi trạng thái */}
          <div className='flex gap-3 justify-end mt-6'>
            {status === "PENDING" && (
              <>
                <Button danger onClick={() => handleChangeStatus("CANCELED")}>
                  Từ chối
                </Button>
                <Button
                  type='primary'
                  onClick={() => handleChangeStatus("APPROVED")}>
                  Chấp nhận
                </Button>
              </>
            )}
            {status === "CHECKED_IN" && (
              <Button
                type='primary'
                onClick={() => handleChangeStatus("QUOTE_APPROVED")}>
                Nhập kết quả kiểm tra
              </Button>
            )}
            {status === "QUOTE_APPROVED" && (
              <Button
                type='primary'
                onClick={() => handleChangeStatus("REPAIR_COMPLETED")}>
                Xác nhận sửa chữa
              </Button>
            )}
            {status === "REPAIR_COMPLETED" && (
              <Button
                type='primary'
                onClick={() => handleChangeStatus("COMPLETED")}>
                Hoàn tất / Xuất hóa đơn
              </Button>
            )}
          </div>
        </motion.div>
      </Drawer>

      {/* QR Modal */}
      <QRModal
        record={{ code: booking.code, qrCode: qrValue }}
        open={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </>
  );
}
