import api from "./api";

const BASE_URL = "/v1/staffs";

export const getStaffByPosition = (position, serviceCenterId = null) => {
  const params = { position };
  if (serviceCenterId) {
    params.serviceCenterId = serviceCenterId;
  }
  const queryParams = new URLSearchParams(params);
  return api.get(`${BASE_URL}?${queryParams.toString()}`);
};

export const getStaffByAccountId = (accountId, params = {}) => {
  const queryParams = new URLSearchParams({ accountId, ...params });
  return api.get(`${BASE_URL}?${queryParams.toString()}`);
};

export const getStaffsByServiceCenterId = (serviceCenterId, params = {}) => {
  const queryParams = new URLSearchParams({ serviceCenterId, ...params });
  return api.get(`${BASE_URL}?${queryParams.toString()}`);
};

export const getStaffById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};