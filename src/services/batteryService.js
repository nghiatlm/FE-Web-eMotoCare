import { importBatteryData } from "../api/batteryApi";

// Import dữ liệu pin từ file (API duy nhất - trả về dữ liệu luôn)
export const importBatteryDataService = async (evCheckDetailId, file) => {
  try {
    const res = await importBatteryData(evCheckDetailId, file);
    console.log("🔋 Import API response:", res);
    // ✅ Response format: { statusCode, success, message, data: { ...batteryData } }
    if (res?.data?.data) {
      return res.data.data; // Trả về data.data (battery data)
    } else if (res?.data) {
      return res.data; // Trả về data
    }
    return res;
  } catch (error) {
    console.error("Lỗi import dữ liệu pin:", error);
    throw error;
  }
};

