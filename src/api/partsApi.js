import api from "./api";

const BASE_URL = "/v1/parts";

export const getParts = ({ page = 1, pageSize = 10, search, status } = {}) => {
  const params = { page, pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  return api.get(BASE_URL, { params });
};


