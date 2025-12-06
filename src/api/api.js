import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Chỉ log trong development mode để tránh conflict với browser extensions
    if (import.meta.env.DEV) {
      try {
        console.log("🔹 [Axios Request Config]:", {
          baseURL: config.baseURL,
          url: config.url,
          fullURL: `${config.baseURL}${config.url}`,
          headers: config.headers,
        });
      } catch (logError) {
      }
    }

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      // Log error nhưng không throw để request vẫn có thể tiếp tục
      if (import.meta.env.DEV) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
    
    // Đảm bảo luôn return config
    return config;
  },
  (error) => {
    // Xử lý lỗi trong request interceptor
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Return response.data để component có thể truy cập data trực tiếp
    // Đảm bảo luôn return một giá trị hợp lệ
    try {
      return response?.data ?? response;
    } catch (err) {
      // Nếu có lỗi khi xử lý response, vẫn return response gốc
      return response;
    }
  },
  (error) => {
    // Xử lý lỗi một cách rõ ràng và đảm bảo promise được reject đúng cách
    // Wrap trong try-catch để đảm bảo luôn reject promise
    try {
      if (error?.response) {
        const { status, data } = error.response;
        if (status === 401) {
          try {
            localStorage.removeItem("user");
            window.location.href = "/login";
          } catch (redirectError) {
            // Ignore redirect errors
          }
        }
        if (import.meta.env.DEV) {
          console.error("API Error:", data?.message || error.message);
        }
        // Reject với error object có đầy đủ thông tin
        const apiError = new Error(data?.message || error.message || "API request failed");
        apiError.response = error.response;
        apiError.data = data;
        apiError.status = status;
        return Promise.reject(apiError);
      } else if (error?.request) {
        // Request đã được gửi nhưng không nhận được response
        if (import.meta.env.DEV) {
          console.error("No response received from server");
        }
        const networkError = new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        networkError.request = error.request;
        return Promise.reject(networkError);
      } else {
        // Lỗi khi setup request
        if (import.meta.env.DEV) {
          console.error("Error creating request:", error.message);
        }
        return Promise.reject(error);
      }
    } catch (interceptorError) {
      // Nếu có lỗi trong interceptor, vẫn reject error gốc
      return Promise.reject(error);
    }
  }
);

export default api;
