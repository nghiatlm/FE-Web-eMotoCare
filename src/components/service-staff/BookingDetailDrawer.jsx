import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";
import { Drawer, Button, Tag, Divider, Select } from "antd";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { fetchTechnicians } from "../../services/staffsService";
import MaintenanceContent from "./detail-content/MaintenanceContent";
import RepairContent from "./detail-content/RepairContent";
import WarrantyContent from "./detail-content/WarrantyContent";
import RecallContent from "./detail-content/RecallContent";

import TechnicianBookingDetailDrawer from "../technician/TechnicanBookingDetailDrawer";
import {
  changeAppointmentStatusService,
  approveAppointmentService,
} from "../../services/appointmentService";

import {
  createEVCheckService,
  fetchEVCheckByAppointmentService,
} from "../../services/evcheckService";

import Payment from "./Payment";
import PaymentInfo from "./PaymentInfo";

const renderServiceContent = (serviceType, booking) => {
  if (!booking.technician) {
    return (
      <div className='text-center py-8 text-gray-500 italic'>
        <p>Kỹ thuật viên chưa thực hiện kiểm tra.</p>
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
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [currentEVCheckId, setCurrentEVCheckId] = useState(null);
  const [showTechnicianDrawer, setShowTechnicianDrawer] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const status = booking?.status?.toUpperCase();

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

    if (open) {
      loadTechs();
      setSelectedTechnician(null);
    }
  }, [open, status]);

  useEffect(() => {
    const loadEV = async () => {
      if (!booking?.id) return;

      try {
        const evCheck = await fetchEVCheckByAppointmentService(booking.id);
        if (evCheck) {
          setCurrentEVCheckId(evCheck.id);
          booking.technician =
            evCheck.taskExecutor || evCheck.technician || null;
        }
      } catch {}
    };

    if (open) loadEV();
  }, [open, booking]);

  if (!booking) return null;

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
      if (evCheckId) setCurrentEVCheckId(evCheckId);

      if (status === "APPROVED") {
        await changeAppointmentStatusService(booking.id, "CHECKED_IN");
        onUpdateStatus?.(booking.id, "CHECKED_IN", selectedTechnician);
      } else {
        onUpdateStatus?.(booking.id, booking.status, selectedTechnician);
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
      onUpdateStatus?.(booking.id, newStatus, booking.technician);
      onClose();
    } catch (e) {
      toast.error(e.message || "Không thể cập nhật trạng thái!");
    }
  };

  /* ------------ MANUAL CHECK-IN BUTTON ------------ */
  const handleManualCheckIn = async () => {
    if (!booking.checkinQRCode) {
      toast.error("Lịch hẹn chưa có mã QR check-in!");
      return;
    }

    try {
      await changeAppointmentStatusService(booking.id, "CHECKED_IN", {
        code: booking.code,
        checkinQRCode: booking.checkinQRCode,
        // Không gửi approveById
        // Không gửi note
      });

      toast.success("Check-in thành công!");
      onUpdateStatus?.(booking.id, "CHECKED_IN");
      onClose();
    } catch (error) {
      console.error("Lỗi check-in:", error);
      toast.error(error.message || "Check-in thất bại!");
    }
  };

  return (
    <>
      <Drawer
        title={
          <div className='flex justify-between items-center'>
            <span className='font-semibold text-lg text-[#c41e0e]'>
              Chi tiết lịch hẹn: {booking.code}
            </span>
            <Tag
              color={STATUS_COLORS[status]}
              className='text-sm px-3 py-1 rounded-full uppercase'>
              {STATUS_MAP[status] || status}
            </Tag>
          </div>
        }
        width='90%'
        open={open}
        onClose={onClose}
        bodyStyle={{ background: "#fff7f3", paddingBottom: 80 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* GENERAL INFO */}
          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border'>
            <h3 className='font-semibold mb-3 border-b pb-2 text-[#d4380d]'>
              Thông tin chung
            </h3>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700'>
              <p>
                <strong>Mã lịch hẹn:</strong> {booking.code}
              </p>
              <p>
                <strong>Người đặt:</strong> {booking.customer?.firstName}{" "}
                {booking.customer?.lastName}
              </p>
              <p>
                <strong>Ngày hẹn:</strong>{" "}
                {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
              </p>
              <p>
                <strong>Trung tâm DV:</strong> {booking.serviceCenter?.name}
              </p>
            </div>
          </section>

          {/* QR CODE DISPLAY */}
          {status === "APPROVED" && booking.checkinQRCode && (
            <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border'>
              <h3 className='font-semibold mb-3 border-b pb-2 text-[#d4380d]'>
                Mã QR Check-in
              </h3>
              <img
                src={booking.checkinQRCode}
                alt='QR Check-in'
                className='w-52 mx-auto rounded-lg shadow'
              />
              <p className='text-center text-sm text-gray-500 mt-2'>
                Khách dùng mã này để thực hiện check-in tại quầy.
              </p>

              {/* MANUAL CHECK-IN BUTTON */}
              <div className='mt-6 text-center'>
                <Button
                  type='primary'
                  size='large'
                  danger
                  onClick={handleManualCheckIn}
                  style={{ minWidth: 200 }}>
                  Check-in ngay
                </Button>
              </div>
            </section>
          )}

          {/* ASSIGN TECHNICIAN */}
          {status === "CHECKED_IN" && !booking.technician && (
            <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border'>
              <h3 className='font-semibold mb-3 border-b pb-2 text-[#d4380d]'>
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
                className='mt-4'
                onClick={handleAssignTechnician}>
                Xác nhận kỹ thuật viên
              </Button>
            </section>
          )}

          {booking.technician && (
            <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border'>
              <h3 className='font-semibold mb-3 border-b pb-2 text-[#d4380d]'>
                Kỹ thuật viên phụ trách
              </h3>
              <p className='text-sm'>
                <strong>Tên:</strong> {booking.technician.firstName}{" "}
                {booking.technician.lastName}
              </p>
            </section>
          )}

          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border'>
            <h3 className='font-semibold mb-3 border-b pb-2 text-[#d4380d]'>
              Kết quả kiểm tra EVCheck
            </h3>
            {!booking.technician ? (
              <div className='text-center text-gray-500 italic py-4'>
                Kỹ thuật viên chưa thực hiện kiểm tra.
              </div>
            ) : (
              <div className='flex justify-end'>
                <Button
                  type='primary'
                  onClick={() => setShowTechnicianDrawer(true)}>
                  Xem chi tiết EVCheck
                </Button>
              </div>
            )}
          </section>

          {/* Thông tin thanh toán - hiển thị khi có EVCheck và status phù hợp */}
          {(status === "REPAIR_COMPLETED" || status === "COMPLETED" || status === "QUOTE_APPROVED") && booking.technician && (
            <div className='mb-6'>
              <PaymentInfo
                booking={booking}
                onOpenPayment={() => setIsPaymentModalOpen(true)}
              />
            </div>
          )}

          <Divider />

          {/* ACTION BUTTONS */}
          <div className='flex gap-3 justify-end'>
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
            {status === "REPAIR_COMPLETED" && (
              <Button
                type='primary'
                onClick={() => setIsPaymentModalOpen(true)}>
                Hoàn tất / Thanh toán
              </Button>
            )}
          </div>
        </motion.div>
      </Drawer>

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
        // onPaymentSuccess={() => handleChangeStatus("COMPLETED")}
      />
    </>
  );
}
