import api from "./api";

const BASE_URL = "/v1/customers";

// Lấy danh sách khách hàng
export const getCustomers = (params = {}) => api.get(BASE_URL, { params });
