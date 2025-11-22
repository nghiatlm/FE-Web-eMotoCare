import api from "./api";

const BASE_URL = "/v1/vehicle-part-items";

export const getVehiclePartItems = (params, config) =>
  api.get(BASE_URL, { params, ...config });
