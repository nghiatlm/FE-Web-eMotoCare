import { createRMA, getRMA } from "../api/rmaApi";

export const createRMAService = async (payload) => {
  const { data } = await createRMA(payload);
  return data?.data;
};
export const getRMAService = async (params = {}) => {
  const res = await getRMA(params);
  return res?.data?.data || res?.data;
};
