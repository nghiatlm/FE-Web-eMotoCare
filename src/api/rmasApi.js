import api from "./api";

const BASE_URL = "/v1/rmas";

export const getRmas = (params = {}) => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.serviceCenterId && { serviceCenterId: params.serviceCenterId }),
  };

  return api.get(BASE_URL, { params: queryParams });
};

export const getRmaById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

export const updateRma = (id, payload) => {
  return api.put(`${BASE_URL}/${id}`, payload);
};

export const updateRmaDetail = (id, payload) => {
  return api.put(`/v1/rma-details/${id}`, payload);
};

