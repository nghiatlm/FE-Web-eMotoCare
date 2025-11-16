import api from "./api";
const BASE_URL = "/v1/part-items";

// Get list of part items with pagination and filters
export const getPartItems = (params = {}) => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.serviceCenterId && { serviceCenterId: params.serviceCenterId }),
  };
  return api.get(BASE_URL, { params: queryParams });
};

// Get part item by ID
export const getPartItemById = (id, config) =>
  api.get(`${BASE_URL}/${id}`, config);

// Get part items by service center ID
export const getPartItemsByServiceCenter = (serviceCenterId) => {
  return api.get(`${BASE_URL}/service-center/${serviceCenterId}`);
};

// Legacy function (for backward compatibility)
export const getPartItem = (config) => api.get(BASE_URL, config);
