import api from "./api";

const BASE_URL = "/v1/rmas";

// Tạo payment link (POST /v1/checkout/create-payment-link)
export const createRMA = (payload) => api.post(BASE_URL, payload);

export const getRMA = (params = {}) => {
  const queryParams = { ...params };
  if (params.serviceCenterId) {
    queryParams.serviceCenterId = params.serviceCenterId;
  }
  return api.get(BASE_URL, { params: queryParams });
};
