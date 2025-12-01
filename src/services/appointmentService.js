import {
  getAppointments,
  updateAppointment,
  postAppointment,
  getAppointmentById,
  getAppointmentsByTechnician,
  getFirstVisitVehicleInfo,
} from "../api/appointmentsApi";

import { fetchServiceStaff } from "./staffsService";
import * as QRCode from "qrcode";
import { uploadDataUrl } from "../utils/firebaseUpload";

// LIST (for Staff/Admin)
export const fetchAppointments = async ({ page = 1, pageSize = 20, serviceCenterId } = {}) => {
  try {
    return await getAppointments({ page, pageSize, serviceCenterId });
  } catch (error) {
    console.error("Lỗi lấy danh sách lịch hẹn:", error);
    throw error;
  }
};

// LIST by Technician (staffId)
export const fetchAppointmentsByTechnician = async (technicianId) => {
  try {
    return await getAppointmentsByTechnician(technicianId);
  } catch (error) {
    console.error("Lỗi lấy danh sách lịch hẹn của kỹ thuật viên:", error);
    throw error;
  }
};

// CREATE
export const createAppointmentService = async (data) => {
  const res = await postAppointment(data);
  return res.data;
};

export const approveAppointmentService = async (appointmentId) => {
  // 1. Lấy staffId
  const staff = await fetchServiceStaff();
  const approveById = staff?.id;
  if (!approveById) throw new Error("Không tìm thấy staffId để duyệt lịch");

  // 2. Lấy thông tin appointment để lấy code (checkinCode) và note
  const appointmentRes = await getAppointmentById(appointmentId);
  const appointment = appointmentRes?.data || appointmentRes;
  const code = appointment?.code;
  if (!code) throw new Error("Không tìm thấy mã check-in cho lịch hẹn");

  // 3. Tạo QR từ code
  const qrDataUrl = await QRCode.toDataURL(code);

  // 4. Upload QR lên Firebase
  const path = `appointments/${appointmentId}/checkin.png`;
  const qrUrl = await uploadDataUrl(path, qrDataUrl);

  // 5. PUT status = APPROVED + approveById + checkinQRCode + note (giữ lại note)
  const res = await updateAppointment(appointmentId, {
    status: "APPROVED",
    approveById,
    checkinQRCode: qrUrl,
    note: appointment?.note || "", // ✅ Giữ lại note
  });

  return res.data;
};

// --- Check-in appointment (FE gửi đầy đủ các field theo yêu cầu BE) ---
export const checkinAppointmentService = async (appointmentId, code, qrUrl) => {
  try {
    if (!code || typeof code !== "string" || code.trim() === "") {
      throw new Error("Mã check-in không hợp lệ.");
    }

    if (!qrUrl || typeof qrUrl !== "string" || qrUrl.trim() === "") {
      throw new Error("Thiếu URL QR check-in.");
    }

    // Lấy approveById (nhân viên đang check-in)
    const staff = await fetchServiceStaff();
    const approveById = staff?.id;
    if (!approveById) throw new Error("Không tìm thấy staffId để check-in");

    // Lấy thông tin appointment hiện tại để giữ lại note
    const appointmentRes = await getAppointmentById(appointmentId);
    const appointment = appointmentRes?.data || appointmentRes;

    return await updateAppointment(appointmentId, {
      status: "CHECKED_IN",
      approveById,
      code: code.trim(),
      checkinQRCode: qrUrl.trim(),
      note: appointment?.note || "", // ✅ Giữ lại note
    });
  } catch (error) {
    console.error("Lỗi check-in appointment:", error);
    throw error;
  }
};

// CHANGE STATUS
export const changeAppointmentStatusService = async (
  appointmentId,
  status,
  extra = {}
) => {
  const upper = status.toUpperCase();

  if (upper === "APPROVED") {
    return approveAppointmentService(appointmentId);
  }

  if (upper === "CHECKED_IN") {
    const { code, checkinQRCode } = extra;
    if (!code || !checkinQRCode) {
      throw new Error("Thiếu mã check-in hoặc URL QR để check-in.");
    }
    return checkinAppointmentService(appointmentId, code, checkinQRCode);
  }

  return updateAppointment(appointmentId, {
    status: upper,
    ...extra,
  });
};

// ✅ Lấy thông tin khách hàng/xe từ số khung (first visit)
export const getVehicleInfoFromChassisService = async (chassisNumber) => {
  try {
    const res = await getFirstVisitVehicleInfo(chassisNumber);
    console.log("🔍 Raw API Response:", res);
    // ✅ Response từ axios: res.data = { statusCode, success, message, data: {...} }
    // Return res.data để có thể access response.success, response.data
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy thông tin từ số khung:", error);
    throw error;
  }
};
