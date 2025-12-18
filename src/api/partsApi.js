import api from "./api";

const BASE_URL = "/v1/parts";
const PART_TYPES_BASE_URL = "/v1/part-types";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;

export const getParts = ({ page = 1, pageSize = 10, search, status, serviceCenterId } = {}) => {
  const params = { page, pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  if (serviceCenterId) params.serviceCenterId = serviceCenterId;
  return api.get(BASE_URL, { params });
};

// Lấy part theo model (model-part-types)
export const getModelParts = ({ modelId, partId, page = 1, pageSize = 100 } = {}) => {
  const params = { modelId, partId, page, pageSize };
  return api.get("/v1/model-part-types", { params });
};

export const getPartTypeById = (partTypeId) => {
  return api.get(`${PART_TYPES_BASE_URL}/${partTypeId}`);
};

export const getPartTypes = (page = 1, pageSize = 100) => {
  const params = { page, pageSize };
  return api.get(PART_TYPES_BASE_URL, { params });
};

export const getPartTypesLabels = () => {
  return api.get(`${PART_TYPES_BASE_URL}/labels`);
};

export const createPart = (partData) => {
  return api.post(BASE_URL, partData);
};

export const getPartById = (partId) => {
  return api.get(`${BASE_URL}/${partId}`);
};

export const updatePart = (partId, partData) => {
  return api.put(`${BASE_URL}/${partId}`, partData);
};

export const deletePart = (partId) => {
  return api.delete(`${BASE_URL}/${partId}`);
};

// ✅ Lấy phụ tùng theo model và partType
export const getPartsByModelAndType = (modelId, partTypeId) => {
  return api.get(`${BASE_URL}/by-model-and-type`, { 
    params: { 
      model: modelId,
      partTypeId: partTypeId 
    } 
  });
};

