import api from "./api";

const BASE_URL = "v1/rmas";
const BASE_DETAIL_URL = "/rma-details";

// Tạo payment link (POST /v1/checkout/create-payment-link)
export const createRMA = (payload) => api.post(BASE_URL, payload);

export const getRMA = (params = {}) => api.get(BASE_URL, { params });

// RMA Detail
export const createRMADetail = (payload) => api.post(BASE_DETAIL_URL, payload);

export const getRMADetails = (params = {}) =>
  api.get(BASE_DETAIL_URL, { params });
