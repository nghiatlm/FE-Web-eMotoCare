// src/components/technician/TechnicianBookingDetailDrawer.jsx
import { useState, useEffect } from "react";
import RepairModeEVCheck from "./detail-content/RepairModeEVCheck";
import MaintenanceModeEVCheck from "./detail-content/MaintenanceModeEVCheck";

import { Drawer, Divider, Button, Input, Spin, message } from "antd";

import {
  fetchEVCheckByAppointmentService,
  updateEVCheckService,
} from "../../services/evcheckService.js";

export default function TechnicianBookingDetailDrawer({
  booking,
  open,
  onClose,
  initialEVCheckId,
  readOnly = false, // staff sẽ truyền readOnly = true
}) {
  const [loading, setLoading] = useState(false);
  const [km, setKm] = useState("");
  const [evCheckId, setEvCheckId] = useState(null);
  const [evCheckStatus, setEvCheckStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasOdometer, setHasOdometer] = useState(false);

  const isRepair = (booking?.type || "").toUpperCase() === "REPAIR_TYPE";
  const isMaintenance =
    (booking?.type || "").toUpperCase() === "MAINTENANCE_TYPE";

  // LẤY SỐ KHUNG TỪ BOOKING.VEHICLE → TỰ ĐỘNG XÁC NHẬN
  const chassisNumber = booking?.vehicle?.chassisNumber || "";
  const chassisConfirmed = !!chassisNumber;

  // ======== LOAD EV CHECK ========
  useEffect(() => {
    if (!open) {
      setKm("");
      setEvCheckId(null);
      setEvCheckStatus(null);
      setHasOdometer(false);
      setLoading(false);
      setRefreshKey(0);
      return;
    }

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

            setHasOdometer(hasKm);
            setKm(hasKm && odometerValue != null ? String(odometerValue) : "");
          } else {
            setHasOdometer(false);
            if (isMaintenance) {
              message.info(
                "Chưa có EV Check. Vui lòng gán kỹ thuật viên / tạo EVCheck trước."
              );
            } else {
              message.info("Chưa có EVCheck. Hãy gán kỹ thuật viên trước.");
            }
          }
        } catch (err) {
          console.error("Lỗi tải EV Check:", err);
          message.error("Không thể tải EV Check!");
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?.id, initialEVCheckId, refreshKey]);

  // ======== CẬP NHẬT KM (Maintenance) – CHỈ DÙNG CHO TECHNICIAN =========
  const handleSendKm = async () => {
    if (!km && km !== 0) return message.error("Vui lòng nhập số KM!");
    const odometerNumber = Number(km);
    try {
      setLoading(true);
      message.loading("Đang cập nhật số KM...", 0);

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
      message.success("Cập nhật số KM thành công!");

      setHasOdometer(true);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Lỗi cập nhật KM:", err);
      message.error(err?.message || "Không thể cập nhật số KM!");
    } finally {
      setLoading(false);
      message.destroy();
    }
  };

  if (!booking) return null;

  return (
    <Drawer
      title={
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-lg text-[#c41e0e]'>
            Chi tiết lịch hẹn: {booking.code}
          </span>
        </div>
      }
      width='90%'
      open={open}
      onClose={onClose}
      bodyStyle={{ paddingBottom: 80 }}>
      {/* THÔNG TIN CHUNG */}
      <section className='bg-white rounded-xl shadow p-5 mb-6 border border-orange-200'>
        <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
          Thông tin chung
        </h3>
        <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700'>
          <p>
            <strong>Mã lịch hẹn:</strong> {booking.code || "—"}
          </p>
          <p>
            <strong>Khách hàng:</strong> {booking.customer?.firstName}{" "}
            {booking.customer?.lastName}
          </p>
          <p>
            <strong>Ngày hẹn:</strong>{" "}
            {new Date(booking.appointmentDate).toLocaleDateString("vi-VN")}
          </p>
          <p>
            <strong>Loại dịch vụ:</strong>{" "}
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                isMaintenance
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-purple-100 text-purple-800 border border-purple-300"
              }`}>
              {isMaintenance ? "Bảo dưỡng" : "Sửa chữa"}
            </span>
          </p>
          {isRepair && chassisNumber && (
            <p className='col-span-2'>
              <strong>Số khung (VIN):</strong>{" "}
              <code className='bg-gray-100 px-2 py-1 rounded text-sm'>
                {chassisNumber}
              </code>
            </p>
          )}
        </div>
      </section>

      {/* ==== NHẬP KM – CHỈ KỸ THUẬT VIÊN THẤY (readOnly = false) ==== */}
      {isMaintenance && evCheckId && !hasOdometer && !readOnly && (
        <section className='bg-white rounded-xl shadow p-5 mb-6 border border-orange-200'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
            Cập nhật số km xe đã đi
          </h3>
          <div className='flex gap-3'>
            <Input
              type='number'
              placeholder='Nhập số km'
              value={km}
              onChange={(e) => setKm(e.target.value)}
              disabled={loading}
            />
            <Button type='primary' loading={loading} onClick={handleSendKm}>
              Cập nhật KM
            </Button>
          </div>
          <p className='mt-2 text-xs text-gray-500'>
            EVCheck đã được tạo, nhưng chưa có số KM. Vui lòng nhập KM để hệ
            thống sinh hạng mục bảo dưỡng.
          </p>
        </section>
      )}

      {/* NẾU MAINTENANCE MÀ CHƯA CÓ EVCheckID LUÔN */}
      {isMaintenance && !evCheckId && (
        <section className='bg-white p-5 border border-orange-200 rounded-xl mb-6'>
          <p className='text-gray-500 italic'>
            Chưa tìm thấy EV Check cho lịch hẹn này. Vui lòng gán kỹ thuật viên
            / tạo EVCheck trước.
          </p>
        </section>
      )}

      {/* NỘI DUNG CHÍNH */}
      {loading ? (
        <div className='flex justify-center p-10'>
          <Spin />
        </div>
      ) : isRepair && chassisConfirmed ? (
        <section className='bg-white rounded-xl shadow p-5 border border-orange-200 max-h-96 overflow-auto'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
            Phiếu sửa chữa
          </h3>
          <RepairModeEVCheck
            key={`repair-${evCheckId || "empty"}-${refreshKey}`}
            booking={booking}
            evCheckId={evCheckId}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
            readOnly={readOnly}
            forceEmpty={!evCheckId}
          />
        </section>
      ) : isMaintenance && evCheckId && (hasOdometer || readOnly) ? ( // 🔴 staff (readOnly) vẫn được xem bảng dù hasOdometer = false
        <section className='bg-white rounded-xl shadow p-5 border border-orange-200'>
          <h3 className='font-semibold text-base mb-3 border-b pb-2 text-orange-600'>
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
        </section>
      ) : null}

      <Divider />
    </Drawer>
  );
}
