import {
  createRMA,
  getRMA,
  createRMADetail,
  getRMADetails,
} from "../api/rmaApi";

export const createRMAService = async (payload) => {
  const { data } = await createRMA(payload);
  return data?.data;
};
export const getRMAService = async (params = {}) => {
  const res = await getRMA(params);
  return res?.data?.data || res?.data;
};

export const createRMADetailService = async (payload) => {
  const { data } = await createRMADetail(payload);
  return data?.data;
};
export const getRMADetailsService = async (params = {}) => {
  const res = await getRMADetails(params);
  return res?.data?.data || res?.data;
};
