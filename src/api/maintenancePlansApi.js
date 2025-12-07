import api from "./api";

const BASE_URL = "/v1/maintenance-plans";

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

