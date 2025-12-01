import api from "./api";
const BASE_URL = "/v1/part-items";
export const getPartItem = (config) => api.get(BASE_URL, config);

export const getPartItems = (params = {}) => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.partId && { partId: params.partId }),
    ...(params.serialNumber && { serialNumber: params.serialNumber }),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.serviceCenterId && { serviceCenterId: params.serviceCenterId }),
  };
  return api.get(BASE_URL, { params: queryParams });
};

export const getPartItemById = (id, config) =>
  api.get(`${BASE_URL}/${id}`, config);

export const getSuggestedPartItems = (evCheckDetailId, config) =>
  api.get(`${BASE_URL}/ev-check-detail/${evCheckDetailId}`, config);

export const getPartItemsByServiceCenter = (serviceCenterId, config) =>
  api.get(`${BASE_URL}/service-center/${serviceCenterId}`, config);
