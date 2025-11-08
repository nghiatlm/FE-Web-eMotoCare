import api from "./api";

const BASE_URL = "/v1/admin/staffs";

export const getStaffByPosition = (position) => {
  return api.get(`${BASE_URL}?position=${position}`);
};
