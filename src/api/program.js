import api from "./api";

export const getAllPrograms = (params) => api.get("/v1/programs", { params });
export const getProgramById = (id) => api.get(`/v1/programs/${id}`);