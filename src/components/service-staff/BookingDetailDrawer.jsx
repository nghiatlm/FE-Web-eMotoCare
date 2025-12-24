import { STATUS_COLORS, STATUS_MAP } from "../../utils/constants";
import { Drawer, Button, Tag, Divider, Select, Input, Modal } from "antd";
import Loading from "../Loading";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";

import { fetchTechnicians } from "../../services/staffsService";
import MaintenanceContent from "./detail-content/MaintenanceContent";
import RepairContent from "./detail-content/RepairContent";
import WarrantyContent from "./detail-content/WarrantyContent";
import RecallContent from "./detail-content/RecallContent";

import TechnicianBookingDetailDrawer from "../technician/TechnicanBookingDetailDrawer";
import {
  changeAppointmentStatusService,
  approveAppointmentService,
  fetchAppointments,
} from "../../services/appointmentService";
import { getServiceCenterById } from "../../api/serviceCentersApi";
import dayjs from "dayjs";

const SLOT_LABEL_MAP = {
  H07_08: "07:00 - 08:00",
  H08_09: "08:00 - 09:00",
  H09_10: "09:00 - 10:00",
  H10_11: "10:00 - 11:00",
  H11_12: "11:00 - 12:00",
  H12_13: "12:00 - 13:00",
  H13_14: "13:00 - 14:00",
  H14_15: "14:00 - 15:00",
  H15_16: "15:00 - 16:00",
  H16_17: "16:00 - 17:00",
  H17_18: "17:00 - 18:00",
};

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
  const [checkinCodeInput, setCheckinCodeInput] = useState("");
  const [isSlotSelectionModalOpen, setIsSlotSelectionModalOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotForCheckIn, setSelectedSlotForCheckIn] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const status = booking?.status?.toUpperCase();

  useEffect(() => {
    const loadTechs = async () => {
      if (status !== "CHECKED_IN") return;

      try {
        setLoadingTechs(true);
        const serviceCenterId = 
          booking?.serviceCenterId || 
          booking?.serviceCenter?.id ||
          null;
        
        if (!serviceCenterId) {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const userServiceCenterId = 
            user?.accountResponse?.serviceCenterId || 
            user?.serviceCenterId || 
            user?.staff?.serviceCenterId ||
            user?.accountResponse?.staff?.serviceCenterId ||
            null;
          if (userServiceCenterId) {
            const list = await fetchTechnicians(userServiceCenterId);
            setTechnicians(list);
            return;
          }
        }
        
        const list = await fetchTechnicians(serviceCenterId);
        setTechnicians(list);
      } catch (err) {
        toast.error((err?.response?.data?.message || err?.data?.message || err?.message || "Không thể tải danh sách kỹ thuật viên"));
      } finally {
        setLoadingTechs(false);
      }
    };

    if (open) {
      loadTechs();
      setSelectedTechnician(null);
    }
  }, [open, status, booking]);

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
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Không thể gán kỹ thuật viên!"));
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
      toast.error((e?.response?.data?.message || e?.data?.message || e?.message || "Không thể cập nhật trạng thái!"));
    }
  };

  const checkSlotAvailability = async (serviceCenterId, appointmentDate, slotTime) => {
    try {
      const appointments = await fetchAppointments({
        page: 1,
        pageSize: 1000,
        serviceCenterId,
      });

      const appointmentList = appointments?.data?.rowDatas || appointments?.data || appointments || [];
      const dateStr = dayjs(appointmentDate).format("YYYY-MM-DD");

      const bookedCount = appointmentList.filter((apt) => {
        const aptDate = dayjs(apt.appointmentDate).format("YYYY-MM-DD");
        const isSameDate = aptDate === dateStr;
        const isSameSlot = apt.slotTime === slotTime;
        const isActive = ["CHECKED_IN", "QUOTE_APPROVED", "REPAIR_COMPLETED", "IN_SERVICE"].includes(apt.status);
        return isSameDate && isSameSlot && isActive && apt.id !== booking?.id;
      }).length;

      const centerRes = await getServiceCenterById(serviceCenterId);
      const center = centerRes?.data?.data || centerRes?.data || centerRes;
      const slot = center?.serviceCenterSlots?.find(
        (s) => s.date === dateStr && s.slotTime === slotTime && s.isActive
      );

      const capacity = slot?.capacity || 1;
      return bookedCount < capacity;
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return true;
    }
  };

  // ✅ Kiểm tra xem có slot sớm hơn slot hiện tại còn trống không
  const checkForEarlierAvailableSlots = async (serviceCenterId, appointmentDate, currentSlotTime) => {
    try {
      const centerRes = await getServiceCenterById(serviceCenterId);
      const center = centerRes?.data?.data || centerRes?.data || centerRes;
      if (!center?.serviceCenterSlots) return false;

      const dateStr = dayjs(appointmentDate).format("YYYY-MM-DD");
      const allSlots = center.serviceCenterSlots
        .filter((s) => s.date === dateStr && s.isActive)
        .sort((a, b) => {
          const getHour = (slotTime) => {
            const match = slotTime?.match(/H(\d{2})_(\d{2})/);
            return match ? parseInt(match[1], 10) : 0;
          };
          return getHour(a.slotTime) - getHour(b.slotTime);
        });

      const getCurrentSlotHour = (slotTime) => {
        const match = slotTime?.match(/H(\d{2})_(\d{2})/);
        return match ? parseInt(match[1], 10) : 0;
      };
      const currentSlotHour = getCurrentSlotHour(currentSlotTime);

      const earlierSlots = allSlots.filter((slot) => {
        const slotHour = getCurrentSlotHour(slot.slotTime);
        return slotHour < currentSlotHour;
      });

      for (const slot of earlierSlots) {
        const isAvailable = await checkSlotAvailability(serviceCenterId, appointmentDate, slot.slotTime);
        if (isAvailable) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking for earlier available slots:", error);
      return false;
    }
  };

  
  const loadAvailableSlots = async (serviceCenterId, appointmentDate, currentSlotTime) => {
    try {
      setLoadingSlots(true);
      const centerRes = await getServiceCenterById(serviceCenterId);
      const center = centerRes?.data?.data || centerRes?.data || centerRes;
      if (!center?.serviceCenterSlots) {
        setAvailableSlots([]);
        return;
      }

      const dateStr = dayjs(appointmentDate).format("YYYY-MM-DD");
      const allSlots = center.serviceCenterSlots
        .filter((s) => s.date === dateStr && s.isActive)
        .sort((a, b) => {
          const getHour = (slotTime) => {
            const match = slotTime?.match(/H(\d{2})_(\d{2})/);
            return match ? parseInt(match[1], 10) : 0;
          };
          return getHour(a.slotTime) - getHour(b.slotTime);
        });

      const availableSlotsList = [];
      for (const slot of allSlots) {
        const isAvailable = await checkSlotAvailability(serviceCenterId, appointmentDate, slot.slotTime);
        if (isAvailable) {
          availableSlotsList.push({
            slotTime: slot.slotTime,
            label: SLOT_LABEL_MAP[slot.slotTime] || slot.slotTime,
            capacity: slot.capacity || 1,
          });
        }
      }

      setAvailableSlots(availableSlotsList);
      
      if (availableSlotsList.length > 0) {
        const currentSlotExists = availableSlotsList.find(s => s.slotTime === currentSlotTime);
        setSelectedSlotForCheckIn(currentSlotExists ? currentSlotTime : availableSlotsList[0].slotTime);
      } else {
        setSelectedSlotForCheckIn(currentSlotTime);
        setAvailableSlots([{
          slotTime: currentSlotTime,
          label: SLOT_LABEL_MAP[currentSlotTime] || currentSlotTime,
          capacity: 0,
        }]);
      }
    } catch (error) {
      console.error("Error loading available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const performCheckIn = async (slotTime) => {
    try {
      await changeAppointmentStatusService(booking.id, "CHECKED_IN", {
        code: booking.code,
        checkinQRCode: booking.checkinQRCode,
        slotTime: slotTime,
      });

      toast.success("Check-in thành công!");
      onUpdateStatus?.(booking.id, "CHECKED_IN");
      setCheckinCodeInput("");
      setIsSlotSelectionModalOpen(false);
      setSelectedSlotForCheckIn(null);
      setAvailableSlots([]);
      onClose();
    } catch (error) {
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Check-in thất bại!"));
    }
  };

  const handleManualCheckIn = async () => {
    if (!booking.checkinQRCode) {
      toast.error("Lịch hẹn chưa có mã QR check-in!");
      return;
    }

    if (!checkinCodeInput || checkinCodeInput.trim() === "") {
      toast.error("Vui lòng nhập mã lịch hẹn để check-in!");
      return;
    }

    if (checkinCodeInput.trim().toUpperCase() !== booking.code?.toUpperCase()) {
      toast.error("Mã lịch hẹn không khớp! Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const serviceCenterId = booking?.serviceCenterId || booking?.serviceCenter?.id;
      const appointmentDate = booking?.appointmentDate;
      const currentSlotTime = booking?.slotTime;

      if (!serviceCenterId || !appointmentDate || !currentSlotTime) {
        await changeAppointmentStatusService(booking.id, "CHECKED_IN", {
          code: booking.code,
          checkinQRCode: booking.checkinQRCode,
        });
        toast.success("Check-in thành công!");
        onUpdateStatus?.(booking.id, "CHECKED_IN");
        setCheckinCodeInput("");
        onClose();
        return;
      }

      const isSlotAvailable = await checkSlotAvailability(
        serviceCenterId,
        appointmentDate,
        currentSlotTime
      );

      if (!isSlotAvailable) {
        await loadAvailableSlots(serviceCenterId, appointmentDate, currentSlotTime);
        setIsSlotSelectionModalOpen(true);
        return; 
      }

      const hasEarlierAvailableSlots = await checkForEarlierAvailableSlots(
        serviceCenterId,
        appointmentDate,
        currentSlotTime
      );

      if (hasEarlierAvailableSlots) {
        await loadAvailableSlots(serviceCenterId, appointmentDate, currentSlotTime);
        setIsSlotSelectionModalOpen(true);
        return; 
      }

      await performCheckIn(currentSlotTime);
    } catch (error) {
      toast.error((error?.response?.data?.message || error?.data?.message || error?.message || "Check-in thất bại!"));
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

              <div className='mt-6 flex flex-col gap-4 items-center'>
                <div className='w-full max-w-md'>
                  <Input
                    placeholder="Nhập mã lịch hẹn để check-in"
                    value={checkinCodeInput}
                    onChange={(e) => setCheckinCodeInput(e.target.value)}
                    onPressEnter={handleManualCheckIn}
                    size="large"
                    className="text-center uppercase"
                    allowClear
                  />
                </div>
                <Button
                  type='primary'
                  size='large'
                  danger
                  onClick={handleManualCheckIn}
                  disabled={!checkinCodeInput || checkinCodeInput.trim() === ""}
                  style={{ minWidth: 200 }}>
                  Check-in
                </Button>
              </div>
            </section>
          )}

          {status === "CHECKED_IN" && !booking.technician && (
            <section style={{ 
              marginBottom: 24, 
              padding: 20, 
              background: "#ffffff", 
              borderRadius: 8,
              border: "1px solid #f0f0f0"
            }}>
              <h3 style={{ 
                marginBottom: 16, 
                fontSize: 16, 
                fontWeight: 600,
                color: "#262626",
                paddingBottom: 12,
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <UserPlus size={16} color="#595959" />
                Chọn kỹ thuật viên
              </h3>
              <div style={{ marginBottom: 16 }}>
                <Select
                  style={{ width: "100%" }}
                  placeholder='Chọn kỹ thuật viên'
                  loading={loadingTechs}
                  value={selectedTechnician?.id}
                  options={technicians.map((t) => ({
                    value: t.id,
                    label: `${t.firstName} ${t.lastName}${t.staffCode ? ` - ${t.staffCode}` : ''}`,
                  }))}
                  onChange={(value) =>
                    setSelectedTechnician(technicians.find((t) => t.id === value))
                  }
                />
              </div>
              {selectedTechnician && (
                <div style={{
                  padding: "12px 16px",
                  background: "#ffffff",
                  borderRadius: 6,
                  border: "1px solid #f0f0f0",
                  marginBottom: 16
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#595959" }}>
                    Đã chọn: <strong>{selectedTechnician.firstName} {selectedTechnician.lastName}</strong>
                    {selectedTechnician.staffCode && ` - ${selectedTechnician.staffCode}`}
                  </p>
                </div>
              )}
              <Button
                type='primary'
                block
                disabled={!selectedTechnician || loadingTechs}
                loading={loadingTechs}
                onClick={handleAssignTechnician}>
                Xác nhận kỹ thuật viên
              </Button>
            </section>
          )}

          {booking.technician && (
            <section style={{
              background: "#ffffff",
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
              border: "1px solid #f0f0f0"
            }}>
              <h3 style={{ 
                marginBottom: 12, 
                fontSize: 16, 
                fontWeight: 600,
                color: "#262626",
                paddingBottom: 12,
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <UserCheck size={16} color="#595959" />
                Kỹ thuật viên phụ trách
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: "#262626" }}>
                <strong>{booking.technician.firstName} {booking.technician.lastName}</strong>
                {booking.technician.staffCode && (
                  <span style={{ color: "#8c8c8c", marginLeft: 8 }}>
                    - {booking.technician.staffCode}
                  </span>
                )}
              </p>
            </section>
          )}

          <section className='bg-white rounded-2xl shadow-md p-5 mb-6 border'>
            <h3 className='font-semibold mb-3 border-b pb-2 text-[#d4380d]'>
              Kết quả kiểm tra phiếu sửa chữa
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

          
          {(status === "REPAIR_COMPLETED" || status === "COMPLETED" || status === "QUOTE_APPROVED") && booking.technician && (
            <div className='mb-6'>
              <PaymentInfo
                booking={booking}
                onOpenPayment={() => setIsPaymentModalOpen(true)}
              />
            </div>
          )}

          <Divider />

          
          <div className='flex gap-3 justify-end'>
            {status === "PENDING" && (
              <>
                <Button danger onClick={() => handleChangeStatus("CANCELED")}>
                  Hủy
                </Button>
                <Button
                  type='primary'
                  onClick={() => handleChangeStatus("APPROVED")}>
                  Chấp nhận
                </Button>
              </>
            )}
            {(status === "APPROVED" || status === "CHECKED_IN") && (
              <Button danger onClick={() => handleChangeStatus("CANCELED")}>
                Hủy lịch hẹn
              </Button>
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

      />

      {/* ✅ Modal chọn slot khi check-in */}
      <Modal
        title='Chọn khung giờ'
        open={isSlotSelectionModalOpen}
        onOk={() => {
          if (selectedSlotForCheckIn) {
            performCheckIn(selectedSlotForCheckIn);
          } else {
            toast.error("Vui lòng chọn khung giờ!");
          }
        }}
        onCancel={() => {
          setIsSlotSelectionModalOpen(false);
          setSelectedSlotForCheckIn(null);
          setAvailableSlots([]);
        }}
        okText='Xác nhận check-in'
        cancelText='Hủy'
        okButtonProps={{ 
          disabled: !selectedSlotForCheckIn || loadingSlots,
          style: { backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }
        }}>
        <div style={{ padding: "16px 0" }}>
          <p style={{ fontSize: 14, marginBottom: 16, color: "#595959" }}>
            Lịch đặt: <strong>{SLOT_LABEL_MAP[booking?.slotTime] || booking?.slotTime}</strong>
          </p>
          <p style={{ fontSize: 14, marginBottom: 16, color: "#595959" }}>
            Vui lòng chọn khung giờ để check-in (có thể chọn slot khác nếu có):
          </p>
          
          {loadingSlots ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Loading />
            </div>
          ) : availableSlots.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "#ff4d4f" }}>Không còn slot trống nào trong ngày này.</p>
            </div>
          ) : (
            <Select
              style={{ width: "100%" }}
              size="large"
              value={selectedSlotForCheckIn}
              onChange={setSelectedSlotForCheckIn}
              placeholder="Chọn khung giờ">
              {availableSlots.map((slot) => {
                const isCurrentSlot = slot.slotTime === booking?.slotTime;
                return (
                  <Select.Option key={slot.slotTime} value={slot.slotTime}>
                    {slot.label} 
                    {isCurrentSlot && " (Lịch đặt)"}
                    {slot.capacity > 1 && !isCurrentSlot && ` (Còn ${slot.capacity} chỗ)`}
                  </Select.Option>
                );
              })}
            </Select>
          )}
        </div>
      </Modal>
    </>
  );
}
