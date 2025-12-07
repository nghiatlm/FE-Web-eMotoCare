import api from "./api";

const BASE_URL = "/v1/maintenance-plans";

/**
 * Lấy danh sách maintenance plans
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @param {number} params.page - Số trang hiện tại (mặc định: 1)
 * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
 * @param {string} params.search - Từ khóa tìm kiếm
 * @param {string} params.status - Trạng thái (ACTIVE, INACTIVE, etc.)
 * @returns {Promise} Response từ API
 */
export const getMaintenancePlans = (params = {}) => {
  const queryParams = {
    page: params.page || params.pageCurrent || 1,
    pageSize: params.pageSize || 10,
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
  };

  return api.get(BASE_URL, { params: queryParams });
};

/**
 * Lấy thông tin chi tiết maintenance plan theo ID
 * @param {string} id - ID của maintenance plan
 * @returns {Promise} Response từ API
 */
export const getMaintenancePlanById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Đồng bộ dữ liệu lịch bảo dưỡng và các giai đoạn bảo dưỡng từ hệ thống OEM
 * @returns {Promise} Response từ API
 */
export const syncMaintenancePlansData = async () => {
  try {
    const response = await api.post(`${BASE_URL}/sync-data`);
    return response;
  } catch (error) {
    // Log error chỉ trong development mode để tránh conflict với browser extensions
    if (import.meta.env.DEV) {
      try {
        console.error("Error in syncMaintenancePlansData:", error);
      } catch (logError) {
        // Ignore logging errors
      }
    }
    // Re-throw error để component có thể handle
    throw error;
  }
};

