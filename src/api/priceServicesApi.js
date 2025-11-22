import api from "./api";

const BASE_URL = "/v1/price-services";

export const getPriceServices = (page = 1, pageSize = 10) => {
  return api.get(BASE_URL, {
    params: {
      page,
      pageSize
    }
  });
};

export const getPriceServiceById = (priceServiceId) => {
  return api.get(`${BASE_URL}/${priceServiceId}`);
};

export const createPriceService = (priceServiceData) => {
  return api.post(BASE_URL, priceServiceData);
};

export const updatePriceService = (priceServiceId, priceServiceData) => {
  return api.put(`${BASE_URL}/${priceServiceId}`, priceServiceData);
};

export const deletePriceService = (priceServiceId) => {
  return api.delete(`${BASE_URL}/${priceServiceId}`);
};

