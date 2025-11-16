import api from "./api";

const BASE_URL = "/v1/appointments";

// Lấy danh sách lịch hẹn
export const getAppointments = ({ page = 1, pageSize = 20 } = {}) =>
  api.get(BASE_URL, { params: { page, pageSize } });
export const postAppointment = (data) => api.post(BASE_URL, data);

// Lấy chi tiết 1 lịch hẹn
export const getAppointmentById = (id) => api.get(`${BASE_URL}/${id}`);

// // Duyệt lịch hẹn
// export const approveAppointment = (appointmentId, staffId) => {
//   if (!staffId) throw new Error("StaffId là bắt buộc để duyệt lịch");
//   return api.post(`${BASE_URL}/${appointmentId}/approve?staffId=${staffId}`);
// };
// ✅ Gửi staffId trong body thay vì query
export const approveAppointment = (appointmentId, body) => {
  // body ví dụ: { staffId: "3f085f64-5717-4562-b3fc-2c963f66afa6", checkinQRCode: "https://..." }
  return api.post(`${BASE_URL}/${appointmentId}/approve`, body);
};

// Lấy mã check-in từ appointmentId
export const getCheckinCode = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/getcode`);

// Check-in theo code
export const checkinAppointmentByCode = (code) =>
  api.post(`${BASE_URL}/checkin/by-code`, { code });
// Gán kỹ thuật viên
export const assignTechnician = (appointmentId, technicianId, approveById) =>
  api.post(
    `${BASE_URL}/assign-technician`,
    {},
    { params: { id: appointmentId, technicianId, approveById } }
  );

// Lấy danh sách phụ tùng thiếu của appointment
export const getAppointmentMissingParts = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/missing-parts`);