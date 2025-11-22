import api from "./api";

const BASE_URL = "/v1/missing-parts";

// Lấy danh sách yêu cầu phụ tùng thiếu
export const getMissingParts = (params = {}) => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.fromDate && { fromDate: params.fromDate }),
    ...(params.toDate && { toDate: params.toDate }),
  };

  return api.get(BASE_URL, { params: queryParams });
};

// Lấy chi tiết yêu cầu phụ tùng thiếu
export const getMissingPartById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

// Tạo yêu cầu phụ tùng thiếu
export const createMissingPart = (data) => {
  return api.post(BASE_URL, data);
};

// Cập nhật yêu cầu phụ tùng thiếu
export const updateMissingPart = (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data);
};

// Xóa/Hủy yêu cầu phụ tùng thiếu
export const deleteMissingPart = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// Duyệt yêu cầu phụ tùng thiếu
export const approveMissingPart = (id, data) => {
  return api.post(`${BASE_URL}/${id}/approve`, data);
};

// Từ chối yêu cầu phụ tùng thiếu
export const rejectMissingPart = (id, data) => {
  return api.post(`${BASE_URL}/${id}/reject`, data);
};

