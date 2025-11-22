import api from "./api";

const BASE_URL = "/v1/vehicle-stages";

// Lấy danh sách mốc bảo dưỡng theo vehicleId
export const getVehicleStages = (params = {}) =>
  api.get(BASE_URL, { params });

