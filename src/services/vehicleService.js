import { getVehiclesByCustomer } from "../api/vehicleApi";

// Lấy danh sách xe theo customerId
export const getVehiclesByCustomerService = async (customerId, params = {}) => {
  const res = await getVehiclesByCustomer(customerId, params);

  return res?.data?.data?.rowDatas || res?.data?.rowDatas || res?.data || [];
};
