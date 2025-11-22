import api from "./api";

const BASE_CHECK = "/v1/evchecks";
const BASE_DETAIL = "/v1/ev-check-details";

// EV CHECK
export const createEVCheck = (data) => api.post(BASE_CHECK, data);
export const updateEVCheck = (id, data) => api.put(`${BASE_CHECK}/${id}`, data);
export const getEVCheckByAppointmentId = (appointmentId) =>
  api.get(BASE_CHECK, { params: { appointmentId } });
// EV CHECK DETAIL
export const getEVCheckDetails = (params = {}) =>
  api.get(BASE_DETAIL, { params: { pageSize: 30, ...params } });
export const getEVCheckDetailById = (id) => api.get(`${BASE_DETAIL}/${id}`);
export const updateEVCheckDetail = (id, data) =>
  api.put(`${BASE_DETAIL}/${id}`, data);
export const createEVCheckDetail = (data) => api.post(BASE_DETAIL, data);
export const getEVCheckById = (id) => api.get(`${BASE_CHECK}/${id}`);
