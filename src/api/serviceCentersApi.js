import api from "./api";

const BASE_URL = "/v1/service-centers";
const token = JSON.parse(localStorage.getItem("user"));
export const getServiceCenters = ({
  search,
  status,
  page = 1,
  pageSize = 10,
} = {}) => {
  const params = {};
  if (search !== undefined && search !== null && String(search).length > 0) {
    params.search = search;
  }
  if (status !== undefined && status !== null && String(status).length > 0) {
    params.status = status;
  }
  params.page = page;
  params.pageSize = pageSize;

  return api.get(BASE_URL, { params, headers: { Authorization: `Bearer ${token}` } });
};

export const getServiceCenterById = (id) => api.get(`${BASE_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const createServiceCenter = (body) => {
  return api.post(BASE_URL, body, { headers: { Authorization: `Bearer ${token}` } });
};

export const updateServiceCenter = (id, body) => api.put(`${BASE_URL}/${id}`, body, { headers: { Authorization: `Bearer ${token}` } });

export const changeServiceCenterStatus = (id, status) =>
  api.put(`${BASE_URL}/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });

// Service Center Slots API
const SLOTS_BASE_URL = "/v1/service-centerslots";

export const createServiceCenterSlot = (serviceCenterId, slotData) => {
  return api.post(SLOTS_BASE_URL, slotData, {
    params: { serviceCenterId },
    headers: { Authorization: `Bearer ${token}` }
  });
};


