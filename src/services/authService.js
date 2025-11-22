import api from "../api/api";

export const authService = {
  async login(email, password) {
    const res = await api.post("/v1/auths/login/staff", { email, password });
    console.log("Response login:", res);

    const user = res.data;

    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  async verifyOtp(otp, email) {
    const res = await api.post("/v1/auths/verify-otp/staff", { otp, email });
    console.log("Response verify OTP:", res);

    const user = res.data;

    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};
