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

