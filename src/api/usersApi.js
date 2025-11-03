import api from "./api";

const BASE_URL = "/v1/admin/users";

// 🟢 Lấy danh sách người dùng với phân trang
export const getUsers = (page = 1, pageSize = 10) => {
  return api.get(`${BASE_URL}?page=${page}&pageSize=${pageSize}`);
};

// 🟢 Lấy thông tin chi tiết người dùng
export const getUserById = (userId) => {
  return api.get(`${BASE_URL}/${userId}`);
};

// 🟢 Cập nhật trạng thái người dùng (block/unblock)
export const updateUserStatus = (userId, status) => {
  return api.put(`${BASE_URL}/${userId}/status`, { status });
};

// 🟢 Tạo người dùng mới
export const createUser = (userData) => {
  return api.post(BASE_URL, userData);
};

// 🟢 Cập nhật thông tin người dùng
export const updateUser = (userId, userData) => {
  return api.put(`${BASE_URL}/${userId}`, userData);
};

// 🟢 Xóa người dùng
export const deleteUser = (userId) => {
  return api.delete(`${BASE_URL}/${userId}`);
};

