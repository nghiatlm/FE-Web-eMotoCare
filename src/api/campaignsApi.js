import api from "./api";

const BASE_URL = "/v1/programs";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;

/**
 * Lấy danh sách campaigns (programs)
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @param {number} params.pageCurrent - Số trang hiện tại (mặc định: 1)
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
    pageCurrent: params.pageCurrent || params.page || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.type && { type: params.type }),
    ...(params.fromDate && { fromDate: params.fromDate }),
    ...(params.toDate && { toDate: params.toDate }),
  };
  return api.get(BASE_URL, { 
    params: queryParams,
    headers: { Authorization: `Bearer ${token}` }
  });
};

/**
 * Lấy thông tin chi tiết campaign theo ID
 * @param {string} id - ID của campaign
 * @returns {Promise} Response từ API
 */
export const getCampaignById = (id) => {
  return api.get(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

/**
 * Tạo campaign mới (program)
 * @param {Object} data - Dữ liệu campaign
 * @param {string} data.type - Loại program (e.g., "RECALL")
 * @param {string} data.title - Tiêu đề campaign
 * @param {string} data.description - Mô tả campaign
 * @param {string} data.startDate - Ngày bắt đầu (ISO string)
 * @param {string} data.endDate - Ngày kết thúc (ISO string)
 * @param {string} data.attachmentUrl - URL file đính kèm (optional)
 * @param {string} data.createdBy - ID người tạo (UUID)
 * @param {string} data.updatedBy - ID người cập nhật (UUID)
 * @param {Array} data.vehicleModels - Danh sách vehicle models [{ vehicleModelId: UUID }]
 * @param {Array} data.programDetails - Chi tiết program [{ recallPartId, serviceType, discountPercent, bonusAmount, recallAction }]
 * @returns {Promise} Response từ API
 */
export const createCampaign = (data) => {
  return api.post(BASE_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

/**
 * Cập nhật campaign
 * @param {string} id - ID của campaign
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response từ API
 */
export const updateCampaign = (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

/**
 * Xóa campaign
 * @param {string} id - ID của campaign
 * @returns {Promise} Response từ API
 */
export const deleteCampaign = (id) => {
  return api.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

