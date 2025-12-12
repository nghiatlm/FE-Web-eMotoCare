import api from "./api";

const BASE_URL = "/v1/battery-checks";

// Import dữ liệu pin từ file (API duy nhất - trả về dữ liệu luôn)
export const importBatteryData = (evCheckDetailId, file) => {
  const formData = new FormData();
  formData.append("evCheckDetailId", evCheckDetailId);
  formData.append("file", file);
  return api.post(`${BASE_URL}/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ✅ Lấy dữ liệu pin theo evCheckDetailId (dùng query param)
// Backend có thể hỗ trợ cả query param hoặc cần battery check ID
export const getBatteryDataByDetailId = (evCheckDetailId) => {
  // ✅ Thử dùng query parameter trước
  return api.get(`${BASE_URL}?evCheckDetailId=${evCheckDetailId}`);
};

