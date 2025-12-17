import api from "./api";

const BASE_URL = "/v1/customers";

export const getCustomers = (params = {}) => api.get(BASE_URL, { params });
