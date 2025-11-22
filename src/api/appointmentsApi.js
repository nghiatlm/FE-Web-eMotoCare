import api from "./api";

const BASE_URL = "/v1/appointments";

export const getAppointments = ({ page = 1, pageSize = 20, serviceCenterId } = {}) => {
  const params = { page, pageSize };
  if (serviceCenterId) {
    params.serviceCenterId = serviceCenterId;
  }
  return api.get(BASE_URL, { params });
};
export const postAppointment = (data) => api.post(BASE_URL, data);


export const getAppointmentById = (id) => api.get(`${BASE_URL}/${id}`);

// // Duyệt lịch hẹn
// export const approveAppointment = (appointmentId, staffId) => {
//   if (!staffId) throw new Error("StaffId là bắt buộc để duyệt lịch");
//   return api.post(`${BASE_URL}/${appointmentId}/approve?staffId=${staffId}`);
// };
// ✅ Gửi staffId trong body thay vì query
export const updateAppointment = (id, body) =>
  api.put(`${BASE_URL}/${id}`, body);

// Lấy danh sách lịch hẹn theo Technician ID (staffId)
export const getAppointmentsByTechnician = (technicianId) => {
  return api.get(`${BASE_URL}/technician/${technicianId}`);
};

export const getAppointmentMissingParts = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/missing-parts`);