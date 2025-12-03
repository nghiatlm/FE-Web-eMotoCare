import api from "./api";

const BASE_URL = "/v1/appointments";

export const getAppointments = ({
  page = 1,
  pageSize = 20,
  serviceCenterId,
  search,
  status,
} = {}) => {
  const params = { page, pageSize };

  if (serviceCenterId) params.serviceCenterId = serviceCenterId;
  if (search) params.search = search.trim();
  if (status && status !== "all") params.status = status;

  return api.get(BASE_URL, { params });
};
export const postAppointment = (data) => api.post(BASE_URL, data);


export const getAppointmentById = (id) => api.get(`${BASE_URL}/${id}`);

export const updateAppointment = (id, body) =>
  api.put(`${BASE_URL}/${id}`, body);

export const getAppointmentsByTechnician = (technicianId) => {
  return api.get(`${BASE_URL}/technician/${technicianId}`);
};

export const getAppointmentMissingParts = (appointmentId) =>
  api.get(`${BASE_URL}/${appointmentId}/missing-parts`);

export const getAppointmentsMissingParts = ({ page = 1, pageSize = 10, sortDesc = true } = {}) => {
  const params = { page, pageSize, sortDesc };
  return api.get(`${BASE_URL}/missing-parts`, { params });
};

export const getFirstVisitVehicleInfo = (chassisNumber) => {
  return api.get(`${BASE_URL}/first-visit/vehicle-info`, { params: { chassisNumber } });
};
