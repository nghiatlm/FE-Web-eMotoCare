import api from "./api";

const BASE_URL = "/v1/appointments";

// Lấy danh sách lịch hẹn
export const getAppointments = () => api.get(BASE_URL);

// Lấy chi tiết 1 lịch hẹn
export const getAppointmentById = (id) => api.get(`${BASE_URL}/${id}`);

// Duyệt lịch hẹn
export const approveAppointment = (appointmentId, staffId) => {
  if (!staffId) throw new Error("StaffId là bắt buộc để duyệt lịch");
  return api.post(`${BASE_URL}/${appointmentId}/approve?staffId=${staffId}`);
};

// Lấy mã check-in từ appointmentId
export const getCheckinCode = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/checkin`);

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
