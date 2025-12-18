import api from "./api";

const BASE_URL = "/v1/battery-checks";

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

export const getBatteryDataByDetailId = (evCheckDetailId) => {
  return api.get(`${BASE_URL}?evCheckDetailId=${evCheckDetailId}`);
};

