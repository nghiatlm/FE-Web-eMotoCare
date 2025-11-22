import api from "./api";
const BASE_URL = "/v1/part-items";
export const getPartItem = (config) => api.get(BASE_URL, config);
export const getPartItemById = (id, config) =>
  api.get(`${BASE_URL}/${id}`, config);

export const getSuggestedPartItems = (evCheckDetailId, config) =>
  api.get(`${BASE_URL}/ev-check-detail/${evCheckDetailId}`, config);

// ✅ Lấy phụ tùng theo service center
export const getPartItemsByServiceCenter = (serviceCenterId, config) =>
  api.get(`${BASE_URL}/service-center/${serviceCenterId}`, config);
