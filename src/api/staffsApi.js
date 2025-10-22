import api from "./api";

const BASE_URL = "/v1/admin/staffs";

// 🟢 Lấy danh sách kỹ thuật viên (lọc theo position)
export const getStaffByPosition = (position) => {
  return api.get(`${BASE_URL}?position=${position}`);
};
