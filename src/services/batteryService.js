import { importBatteryData, getBatteryDataByDetailId } from "../api/batteryApi";

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

// ✅ Lấy dữ liệu pin theo evCheckDetailId
export const getBatteryDataService = async (evCheckDetailId) => {
  try {
    const res = await getBatteryDataByDetailId(evCheckDetailId);
    console.log("🔋 Get Battery Data API response:", res);
    
    // ✅ Response format có thể là:
    // 1. { statusCode, success, message, data: { pageCurrent, pageSize, total, rowDatas: [...] } }
    // 2. { statusCode, success, message, data: { ...batteryData } }
    // 3. { data: { ...batteryData } }
    
    // ✅ Nếu có rowDatas (list response), lấy item đầu tiên
    if (res?.data?.data?.rowDatas && Array.isArray(res.data.data.rowDatas) && res.data.data.rowDatas.length > 0) {
      console.log("🔋 Found battery data in rowDatas:", res.data.data.rowDatas[0]);
      return res.data.data.rowDatas[0]; // Lấy item đầu tiên từ list
    }
    
    // ✅ Nếu có rowDatas trực tiếp trong data
    if (res?.data?.rowDatas && Array.isArray(res.data.rowDatas) && res.data.rowDatas.length > 0) {
      console.log("🔋 Found battery data in data.rowDatas:", res.data.rowDatas[0]);
      return res.data.rowDatas[0]; // Lấy item đầu tiên từ list
    }
    
    // ✅ Nếu là object trực tiếp
    if (res?.data?.data && (res.data.data.id || res.data.data.sampleCount !== undefined)) {
      return res.data.data; // Trả về data.data (battery data object)
    } else if (res?.data && (res.data.id || res.data.sampleCount !== undefined)) {
      return res.data; // Trả về data (battery data object)
    }
    
    console.log("🔋 No valid battery data structure found in response");
    return null;
  } catch (error) {
    // ✅ Nếu không tìm thấy (404) thì return null, không throw error
    if (error?.response?.status === 404) {
      console.log("🔋 No battery data found for evCheckDetailId:", evCheckDetailId);
      return null;
    }
    console.error("Lỗi lấy dữ liệu pin:", error);
    throw error;
  }
};

