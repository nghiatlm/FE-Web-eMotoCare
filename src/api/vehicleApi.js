import api from "./api";

const BASE_URL = "/v1/vehicles";

// Lấy danh sách xe theo customerId
export const getVehiclesByCustomer = (customerId, params = {}) =>
  api.get(BASE_URL, { params: { customerId, ...params } });
