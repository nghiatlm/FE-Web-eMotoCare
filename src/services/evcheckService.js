import {
  createEVCheck,
  updateEVCheck,
  getEVCheckDetails,
  getEVCheckDetailById,
  updateEVCheckDetail,
  createEVCheckDetail,
  getEVCheckByAppointmentId,
} from "../api/evcheck";

export const createEVCheckService = async (payload) => {
  const { data } = await createEVCheck(payload);
  return data?.data;
};
export const updateEVCheckService = async (id, payload) => {
  const { data } = await updateEVCheck(id, payload);
  return data?.data;
};
// Trong evcheckService.js

export const fetchEVCheckByAppointmentService = async (appointmentId) => {
  const { data } = await getEVCheckByAppointmentId(appointmentId);
  console.log("🐞 [fetchEVCheckByAppointmentService] API response DATA:", data);

  // ✅ SỬA LỖI: Truy cập trực tiếp vào 'rowDatas' của đối tượng 'data'
  const evCheckList = data?.rowDatas;

  if (Array.isArray(evCheckList) && evCheckList.length > 0) {
    // Trả về EVCheck object đầu tiên, đối tượng này chứa 'id'
    return evCheckList[0];
  }

  // Nếu không tìm thấy, trả về undefined an toàn
  return undefined;
};

// ... (Các service khác giữ nguyên)
// ============== DETAIL ==============

export const fetchEVCheckDetailsService = async (checkId) => {
  const { data } = await getEVCheckDetails({ params: { eVCheckId: checkId } });
  console.log("fetchEVCheckDetailsService RAW DATA:", data);

  const rowDatas = data?.data?.rowDatas || data?.rowDatas || [];

  // Lấy odometer từ EVCheck cha (nếu API trả kèm)
  // Giả sử API trả kèm thông tin EVCheck: data?.odometer
  const odometer = data?.odometer || data?.data?.odometer || "";

  // Trả về object giống như GET /evchecks/{id}
  return {
    odometer,
    evCheckDetails: rowDatas, // ← quan trọng
  };
};

export const fetchEVCheckDetailByIdService = async (id) => {
  const { data } = await getEVCheckDetailById(id);
  return data?.data;
};

export const updateEVCheckDetailService = async (id, payload) => {
  const { data } = await updateEVCheckDetail(id, payload);
  return data?.data;
};

export const createEVCheckDetailService = async (payload) => {
  const { data } = await createEVCheckDetail(payload);
  return data?.data;
};
