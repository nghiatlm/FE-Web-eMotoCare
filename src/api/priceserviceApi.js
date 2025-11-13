import api from "./api";

const BASE_URL = "/v1/price-services";
export const getPriceServices = (params = {}) => api.get(BASE_URL, { params });
