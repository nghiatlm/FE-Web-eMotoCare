import { getStaffByPosition } from "../api/staffsApi";

// 🟢 Lấy danh sách kỹ thuật viên
export const fetchTechnicians = async () => {
  try {
    const res = await getStaffByPosition("TECHINICIAN_STAFF"); // truyền position
    console.log("Technicians API response:", res.data); // kiểm tra response
    return res?.data?.rowDatas || []; // trả về mảng nhân viên
  } catch (error) {
    console.error("Lỗi lấy danh sách kỹ thuật viên:", error);
    throw error;
  }
};

// 🟢 Lấy danh sách nhân viên service staff
export const fetchServiceStaff = async () => {
  try {
    const res = await getStaffByPosition("SERVICE_STAFF");
    console.log("Service Staff API response:", res.data);
    return res?.data?.rowDatas?.[0] || null; // lấy staff đầu tiên hoặc null
  } catch (error) {
    console.error("Lỗi lấy danh sách service staff:", error);
    throw error;
  }
};
