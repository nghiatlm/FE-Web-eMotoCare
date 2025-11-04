import api from "./api";

const BASE_URL = "/v1/parts";
const PART_TYPES_BASE_URL = "https://ef518f64eb02.ngrok-free.app/api/v1/part-types";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;

export const getParts = ({ page = 1, pageSize = 10, search, status } = {}) => {
  const params = { page, pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  return api.get(BASE_URL, { params });
};

export const getPartTypeById = (partTypeId) => {
  return api.get(`${PART_TYPES_BASE_URL}/${partTypeId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getPartTypes = (page = 1, pageSize = 100) => {
  return api.get(`${PART_TYPES_BASE_URL}?page=${page}&pageSize=${pageSize}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};


