import api from "./api";

const BASE_URL = "/v1/service-center-inventories";

export const getServiceCenterInventories = (params = {}) => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    // ...(params.serviceCenterId && { serviceCenterId: params.serviceCenterId }),
    ...(params.serviceCenterInventoryName && { serviceCenterInventoryName: params.serviceCenterInventoryName }),
  };

  return api.get(BASE_URL, { params: queryParams });
};

