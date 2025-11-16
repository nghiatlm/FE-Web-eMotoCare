import api from "./api";

export const authApi = {
  login: (email, password) => api.post("/v1/auths/login/staff", { email, password }),
};
