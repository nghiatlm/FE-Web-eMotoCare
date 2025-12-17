import api from "./api";

const BASE_URL = "/v1/dashboards";

/**
 * Lấy tổng quan dashboard
 * @returns {Promise} Response từ API với các thống kê tổng quan
 */
export const getDashboardOverview = (serviceCenterId, params = {}) => {
  return api.get(`${BASE_URL}/overview`, {
    params: {
      serviceCenterId,
      ...params,
    },
  });
};

/**
 * Lấy dữ liệu overview (không cần serviceCenterId)
 * @param {number} year - Năm cần lấy dữ liệu (optional)
 * @returns {Promise} Response từ API với dữ liệu 12 tháng
 */
export const getDashboardOverviewData = (year = null) => {
  const params = {};
  if (year) {
    params.year = year;
  }
  return api.get(`${BASE_URL}/overview`, { params });
};

