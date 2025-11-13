import api from "./api";

const BASE_URL = "/v1/checkout";

// Tạo payment link (POST /v1/checkout/create-payment-link)
export const createPaymentLink = (payload) =>
  api.post(`${BASE_URL}/create-payment-link`, payload);
