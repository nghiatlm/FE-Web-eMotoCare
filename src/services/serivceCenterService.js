import { getServiceCenters } from "../api/serviceCentersApi";

// Lấy danh sách trung tâm dịch vụ
export const getServiceCentersService = async (params = {}) => {
  const res = await getServiceCenters(params);

  return res?.data?.data?.rowDatas || res?.data?.rowDatas || res?.data || [];
};
