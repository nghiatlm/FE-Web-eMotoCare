import api from "./api";

export const authApi = {
  login: (email, password) =>
    api.post("/v1/auths/login/staff", { email, password }),
  verifyOtp: (otp, email) =>
    api.post("/v1/auths/verify-otp/staff", { otp, email }),
  changePassword: (accountId, oldPassword, newPassword) =>
    api.post(`/v1/auths/change-password/${accountId}`, {
      oldPassword,
      newPassword,
    }),
};
