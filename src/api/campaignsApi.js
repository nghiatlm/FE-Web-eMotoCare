import api from "./api";

const BASE_URL = "/v1/campaigns";

/**
 * Lấy danh sách campaigns
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @param {number} params.page - Số trang (mặc định: 1)
 * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
 * @param {string} params.search - Từ khóa tìm kiếm
 * @param {string} params.status - Trạng thái campaign (ACTIVE, INACTIVE, etc.)
 * @param {string} params.type - Loại campaign
 * @param {string} params.fromDate - Ngày bắt đầu (format: YYYY-MM-DD)
 * @param {string} params.toDate - Ngày kết thúc (format: YYYY-MM-DD)
 * @returns {Promise} Response từ API
 */
export const getCampaigns = (params = {}) => {
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.type && { type: params.type }),
    ...(params.fromDate && { fromDate: params.fromDate }),
    ...(params.toDate && { toDate: params.toDate }),
  };
  return api.get(BASE_URL, { params: queryParams });
};

/**
 * Lấy thông tin chi tiết campaign theo ID
 * @param {string} id - ID của campaign
 * @returns {Promise} Response từ API
 */
export const getCampaignById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Tạo campaign mới
 * @param {Object} data - Dữ liệu campaign
 * @returns {Promise} Response từ API
 */
export const createCampaign = (data) => {
  return api.post(BASE_URL, data);
};

/**
 * Cập nhật campaign
 * @param {string} id - ID của campaign
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response từ API
 */
export const updateCampaign = (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data);
};

/**
 * Xóa campaign
 * @param {string} id - ID của campaign
 * @returns {Promise} Response từ API
 */
export const deleteCampaign = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

