import {
  getAppointments,
  approveAppointment,
  checkinAppointmentByCode,
  assignTechnician,
  getCheckinCode,
  postAppointment,
} from "../api/appointmentsApi";
import { fetchServiceStaff } from "./staffsService";
import * as QRCode from "qrcode";
import { uploadDataUrl } from "../utils/firebaseUpload";

// Lấy danh sách lịch hẹn
export const fetchAppointments = async ({ page = 1, pageSize = 20, serviceCenterId } = {}) => {
  try {
    return await getAppointments({ page, pageSize, serviceCenterId });
  } catch (error) {
    console.error("Lỗi lấy danh sách lịch hẹn:", error);
    throw error;
  }
};

export const createAppointmentService = async (data) => {
  const res = await postAppointment(data);
  return res.data;
};

// // Duyệt lịch hẹn
// export const approveAppointmentService = async (appointmentId) => {
//   try {
//     const staff = await fetchServiceStaff();
//     const staffId = staff?.id;
//     if (!staffId) throw new Error("Không tìm thấy staffId để duyệt lịch");
//     return await approveAppointment(appointmentId, staffId);
//   } catch (error) {
//     console.error("Lỗi duyệt lịch hẹn:", error);
//     throw error;
//   }
// };

export const approveAppointmentService = async (appointmentId) => {
  // 1) Lấy staffId
  const staff = await fetchServiceStaff();
  const staffId = staff?.id;
  if (!staffId) throw new Error("Không tìm thấy staffId để duyệt lịch");

  // 2) Gen QR → dataURL PNG
  const qrText = `APPT:${appointmentId}`;
  const dataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: "M" });

  // 3) Upload ảnh QR lên Firebase Storage
  const path = `appointments/${appointmentId}/checkin.png`;
  const downloadUrl = await uploadDataUrl(path, dataUrl);

  // 4) Gọi BE approve với body
  const body = { staffId, checkinQRCode: downloadUrl };
  const res = await approveAppointment(appointmentId, body);
  return res.data;
};

// Lấy mã check-in (service)
export const fetchCheckinCodeService = async (appointmentId) => {
  try {
    const res = await getCheckinCode(appointmentId); // gọi API

    const code = res?.data?.code;

    if (!code) {
      throw new Error("API không trả về mã check-in hợp lệ.");
    }

    return code;
  } catch (error) {
    console.error("Lỗi lấy mã check-in:", error);
    throw new Error(error.message || "Không thể lấy mã check-in");
  }
};

// Check-in bằng code (service)
export const checkinByCodeService = async (code) => {
  try {
    const res = await checkinAppointmentByCode(code);
    return res.data;
  } catch (error) {
    console.error("Lỗi check-in:", error);
    throw new Error(error.message || "Check-in thất bại!");
  }
};

//  Check-in appointment theo ID (tự lấy code trước)
export const checkinAppointmentService = async (appointmentId) => {
  try {
    const code = await fetchCheckinCodeService(appointmentId);
    if (!code) throw new Error("Không lấy được mã check-in");

    return await checkinByCodeService(code);
  } catch (error) {
    console.error("Lỗi check-in appointment:", error);
    throw error;
  }
};

//  Gán kỹ thuật viên
export const assignAppointmentTechnicianService = async (
  appointmentId,
  technicianId
) => {
  try {
    const staff = await fetchServiceStaff();
    const staffId = staff?.id;
    if (!staffId)
      throw new Error("Không tìm thấy staffId để gán kỹ thuật viên");
    return await assignTechnician(appointmentId, technicianId, staffId);
  } catch (error) {
    console.error("Lỗi gán kỹ thuật viên:", error);
    throw error;
  }
};

// // Cập nhật trạng thái lịch hẹn (duyệt, check-in, hoàn tất,...)
// export const changeAppointmentStatusService = async (appointmentId, status) => {
//   try {
//     if (status === "APPROVED") {
//       const staff = await fetchServiceStaff();
//       const staffId = staff?.id;
//       if (!staffId) throw new Error("Không tìm thấy staffId để duyệt lịch");
//       return await approveAppointment(appointmentId, staffId);
//     } else if (status === "CHECKED_IN") {
//       const code = await fetchCheckinCodeService(appointmentId);
//       if (!code) throw new Error("Không lấy được mã check-in");

//       return await checkinByCodeService(code);
//     } else {
//       throw new Error("Chức năng cập nhật trạng thái khác chưa triển khai");
//     }
//   } catch (error) {
//     console.error("Lỗi cập nhật trạng thái lịch hẹn:", error);
//     throw error;
//   }
// };

export const changeAppointmentStatusService = async (appointmentId, status) => {
  try {
    if (status === "APPROVED") {
      const staff = await fetchServiceStaff();
      const staffId = staff?.id;
      if (!staffId) throw new Error("Không tìm thấy staffId để duyệt lịch");

      // Gen QR + upload
      const dataUrl = await QRCode.toDataURL(appointmentId);
      const path = `appointments/${appointmentId}/checkin.png`;
      const checkinQRCode = await uploadDataUrl(path, dataUrl);

      // Gọi approve kèm staffId + checkinQRCode
      return await approveAppointment(appointmentId, {
        staffId,
        checkinQRCode,
      });
    } else if (status === "CHECKED_IN") {
      const code = await fetchCheckinCodeService(appointmentId);
      if (!code) throw new Error("Không lấy được mã check-in");
      return await checkinByCodeService(code);
    } else {
      throw new Error("Chức năng cập nhật trạng thái khác chưa triển khai");
    }
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái lịch hẹn:", error);
    throw error;
  }
};
