import { getCustomers } from "../api/customerApi";

export const getCustomersService = async (params = {}) => {
  const res = await getCustomers(params);

  return (
    res?.data?.data?.rowDatas || // đúng cấu trúc BE
    res?.data?.rowDatas ||
    res?.data ||
    []
  );
};
