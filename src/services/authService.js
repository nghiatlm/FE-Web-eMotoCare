import api from "../api/api";

export const authService = {
  async login(phone, password) {
    const res = await api.post("/v1/auths/login", { phone, password });
    console.log("Response login:", res);

    const user = res.data;

    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem("user");
  },

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};
