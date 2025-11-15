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
export const updateAppointment = (id, body) =>
  api.put(`${BASE_URL}/${id}`, body);
