import api from "./api";

const BASE_URL = "/v1/models";

/**
 * Lấy danh sách vehicle models
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @param {number} params.page - Số trang hiện tại (mặc định: 1)
 * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
 * @param {string} params.search - Từ khóa tìm kiếm
 * @param {string} params.status - Trạng thái model (ACTIVE, INACTIVE, etc.)
 * @returns {Promise} Response từ API
 */
export const getModels = (params = {}) => {
  const queryParams = {
    page: params.page || params.pageCurrent || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
  };
  // Token đã được gắn sẵn qua axios interceptor trong api.js
  return api.get(BASE_URL, { params: queryParams });
};

/**
 * Lấy thông tin chi tiết model theo ID
 * @param {string} id - ID của model
 * @returns {Promise} Response từ API
 */
export const getModelById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Đồng bộ dữ liệu model từ hệ thống OEM
 * @returns {Promise} Response từ API
 */
export const syncModelData = async () => {
  try {
    const response = await api.post(`${BASE_URL}/sync-model`);
    return response;
  } catch (error) {
    // Log error chỉ trong development mode để tránh conflict với browser extensions
    if (import.meta.env.DEV) {
      try {
        console.error("Error in syncModelData:", error);
      } catch (logError) {
        // Ignore logging errors
      }
    }
    // Re-throw error để component có thể handle
    throw error;
  }
};

