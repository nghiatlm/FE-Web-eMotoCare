import api from "./api";

const BASE_URL = "/v1/dashboards";


export const getDashboardOverview = (serviceCenterId, params = {}) => {
  return api.get(`${BASE_URL}/overview`, {
    params: {
      serviceCenterId,
      ...params,
    },
  });
};

