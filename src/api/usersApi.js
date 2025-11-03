import api from "./api";

const BASE_URL = "/v1/users";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;
export const getUsers = (page = 1, pageSize = 10) => {
  return api.get(`${BASE_URL}?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getUserById = (userId) => {
  return api.get(`${BASE_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUserStatus = (userId, status) => {
  return api.put(
    `${BASE_URL}/${userId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const createUser = (userData) => {
  return api.post(BASE_URL, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUser = (userId, userData) => {
  return api.put(`${BASE_URL}/${userId}`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteUser = (userId) => {
  return api.delete(`${BASE_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
