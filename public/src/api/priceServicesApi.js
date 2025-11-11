import api from "./api";
const BASE_URL = "/v1/price-services";
const user = JSON.parse(localStorage.getItem("user"));
const token = user?.token;

export const getPriceServices = (page = 1, pageSize = 10) => {
  return api.get(`${BASE_URL}?page=${page}&pageSize=${pageSize}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getPriceServiceById = (priceServiceId) => {
  return api.get(`${BASE_URL}/${priceServiceId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const createPriceService = (priceServiceData) => {
  return api.post(BASE_URL, priceServiceData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updatePriceService = (priceServiceId, priceServiceData) => {
  return api.put(`${BASE_URL}/${priceServiceId}`, priceServiceData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const deletePriceService = (priceServiceId) => {
  return api.delete(`${BASE_URL}/${priceServiceId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

