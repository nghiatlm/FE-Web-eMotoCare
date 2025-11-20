import api from "./api";

const BASE_URL = "/v1/appointments";

export const getAppointments = ({ page = 1, pageSize = 20, serviceCenterId } = {}) =>
  api.get(BASE_URL, { params: { page, pageSize, serviceCenterId } });

export const postAppointment = (data) => api.post(BASE_URL, data);

export const getAppointmentById = (id) => api.get(`${BASE_URL}/${id}`);

export const approveAppointment = (appointmentId, body) => {
  return api.post(`${BASE_URL}/${appointmentId}/approve`, body);
};

export const getCheckinCode = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/getcode`);

export const checkinAppointmentByCode = (code) =>
  api.post(`${BASE_URL}/checkin/by-code`, { code });

export const assignTechnician = (appointmentId, technicianId, approveById) =>
  api.post(
    `${BASE_URL}/assign-technician`,
    {},
    { params: { id: appointmentId, technicianId, approveById } }
  );

export const getAppointmentMissingParts = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/missing-parts`);