import { getStaffByPosition, getStaffsByServiceCenterId } from "../api/staffsApi";

// 🟢 Lấy danh sách kỹ thuật viên
export const fetchTechnicians = async (serviceCenterId = null) => {
  try {
    let res;
    if (serviceCenterId) {
      // Lấy theo serviceCenterId và position
      res = await getStaffsByServiceCenterId(serviceCenterId, { position: "TECHNICIAN_STAFF" });
    } else {
      res = await getStaffByPosition("TECHNICIAN_STAFF");
    }
    console.log("Technicians API response:", res.data);
    return res?.data?.rowDatas || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách kỹ thuật viên:", error);
    throw error;
  }
};

// 🟢 Lấy danh sách nhân viên service staff
export const fetchServiceStaff = async (serviceCenterId = null) => {
  try {
    let res;
    if (serviceCenterId) {
      // Lấy theo serviceCenterId và position
      res = await getStaffsByServiceCenterId(serviceCenterId, { position: "SERVICE_STAFF" });
    } else {
      res = await getStaffByPosition("SERVICE_STAFF");
    }
    console.log("Service Staff API response:", res.data);
    return res?.data?.rowDatas?.[0] || null;
  } catch (error) {
    console.error("Lỗi lấy danh sách service staff:", error);
    throw error;
  }
};
