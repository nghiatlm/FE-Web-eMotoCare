import api from "./api";

const BASE_URL = "/v1/rmas";

// Tạo payment link (POST /v1/checkout/create-payment-link)
export const createRMA = (payload) => api.post(BASE_URL, payload);

export const getRMA = (params = {}) => api.get(BASE_URL, { params });
