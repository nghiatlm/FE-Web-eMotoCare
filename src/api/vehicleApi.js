import api from "./api";

const BASE_URL = "/v1/vehicles";

// Lấy danh sách xe theo customerId
export const getVehiclesByCustomer = (customerId, params = {}) =>
  api.get(BASE_URL, { params: { customerId, ...params } });

/**
 * Tìm kiếm xe theo số khung (chassis number)
 * @param {string} chassisNumber - Số khung xe
 * @returns {Promise} Response từ API
 */
export const searchVehicleByChassis = (chassisNumber) => {
  return api.get(BASE_URL, {
    params: {
      chassisNumber,
      page: 1,
      pageSize: 1,
    }
  });
};

/**
 * Lấy thông tin chi tiết xe theo ID
 * @param {string} id - ID của xe
 * @returns {Promise} Response từ API
 */
export const getVehicleById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};