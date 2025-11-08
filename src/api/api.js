import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      console.error("API Error:", data?.message || error.message);
      return Promise.reject(data || error);
    } else if (error.request) {
      console.error("No response received from server");
    } else {
      console.error("Error creating request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
