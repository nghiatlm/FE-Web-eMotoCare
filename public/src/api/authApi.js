import api from "./api";

export const authApi = {
  login: (phone, password) => api.post("/v1/auths/login", { phone, password }),
};
