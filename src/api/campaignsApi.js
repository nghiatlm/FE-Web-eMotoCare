import api from "./api";

// Backend hiện dùng resource "programs" cho cả campaign/recall
const BASE_URL = "/v1/programs";

/**
 * Lấy danh sách campaigns (programs)
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @param {number} params.pageCurrent - Số trang hiện tại (mặc định: 1)
 * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
 * @param {string} params.search - Từ khóa tìm kiếm
 * @param {string} params.status - Trạng thái campaign (ACTIVE, INACTIVE, etc.)
 * @param {string} params.type - Loại campaign
 * @param {string} params.modelId - ID của vehicle model để lọc campaigns
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

  // Token đã được gắn sẵn qua axios interceptor trong api.js
  return api.get(BASE_URL, { params: queryParams });
};

/**
 * Lấy thông tin chi tiết campaign theo ID
 * @param {string} id - ID của campaign
 * @returns {Promise} Response từ API
 */
export const getCampaignById = (id) => api.get(`${BASE_URL}/${id}`);

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
export const createCampaign = (data) => api.post(BASE_URL, data);

/**
 * Cập nhật campaign
 * @param {string} id - ID của campaign
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response từ API
 */
export const updateCampaign = (id, data) => api.put(`${BASE_URL}/${id}`, data);

/**
 * Xóa campaign
 * @param {string} id - ID của campaign
 * @returns {Promise} Response từ API
 */
export const deleteCampaign = (id) => api.delete(`${BASE_URL}/${id}`);

/**
 * Đồng bộ dữ liệu chiến dịch từ hệ thống OEM
 * @returns {Promise} Response từ API
 */
export const syncCampaignsData = async () => {
  try {
    const response = await api.post(`${BASE_URL}/sync-data`);
    return response;
  } catch (error) {
    // Log error chỉ trong development mode để tránh conflict với browser extensions
    if (import.meta.env.DEV) {
      try {
        console.error("Error in syncCampaignsData:", error);
      } catch (logError) {
        // Ignore logging errors
      }
    }
    // Re-throw error để component có thể handle
    throw error;
  }
};

