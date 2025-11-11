import api from "./api";

const BASE_URL = "/v1/staffs";

// 🟢 Lấy danh sách kỹ thuật viên (lọc theo position)
export const getStaffByPosition = (position) => {
  return api.get(`${BASE_URL}?position=${position}`);
};

// 🟢 Lấy staff theo accountId
export const getStaffByAccountId = (accountId, params = {}) => {
  const queryParams = new URLSearchParams({ accountId, ...params });
  return api.get(`${BASE_URL}?${queryParams.toString()}`);
};

// 🟢 Lấy danh sách staff theo serviceCenterId
export const getStaffsByServiceCenterId = (serviceCenterId, params = {}) => {
  const queryParams = new URLSearchParams({ serviceCenterId, ...params });
  return api.get(`${BASE_URL}?${queryParams.toString()}`);
};

// 🟢 Lấy chi tiết staff theo ID
export const getStaffById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};