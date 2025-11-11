import api from "./api";
const BASE_URL = "/v1/part-items";
export const getPartItem = (config) => api.get(BASE_URL, config);
export const getPartItemById = (id, config) =>
  api.get(`${BASE_URL}/${id}`, config);
