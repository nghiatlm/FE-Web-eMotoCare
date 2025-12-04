// src/contexts/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      console.log("Login response:", response);
      
      // Kiểm tra nếu response có message về OTP
      // Response structure khi cần OTP: { statusCode: 200, success: true, message: "thành công", data: "OTP đã được gửi đến email..." }
      // Response structure khi login thành công: { accountResponse: {...}, ... } hoặc { data: { accountResponse: {...} } }
      
      const responseData = response?.data;
      const isDataString = typeof responseData === 'string';
      const hasOtpMessage = isDataString && responseData.toUpperCase().includes('OTP');

      if (hasOtpMessage) {
        // Lưu email vào localStorage để dùng trong verify OTP
        localStorage.setItem("pendingEmail", email);
        
        // Redirect đến trang verify OTP với email
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
          state: { email },
          replace: true
        });
        return response;
      }

      // Nếu không cần OTP, xử lý như user object
      // response có thể là user object trực tiếp hoặc có structure { data: user }
      const user = response?.accountResponse ? response : (response?.data || response);
      
      // Kiểm tra nếu có accountResponse (là user object hợp lệ)
      if (user?.accountResponse) {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        
        const roleName = user.accountResponse.roleName;
        console.log("Detected role:", roleName);

        if (roleName === "ROLE_ADMIN") navigate("/admin");
        else if (roleName === "ROLE_STAFF") navigate("/staff");
        else if (roleName === "ROLE_MANAGER") navigate("/manager");
        else if (roleName === "ROLE_TECHNICIAN") navigate("/technician");
        else if (roleName === "ROLE_STOREKEEPER") navigate("/storekeeper");
        else navigate("/");
      } else {
        // Nếu không có user object, vẫn redirect đến verify-otp để an toàn
        console.warn("Unexpected login response structure:", response);
        localStorage.setItem("pendingEmail", email);
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
          state: { email },
          replace: true
        });
      }
      
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp, email) => {
    setLoading(true);
    try {
      const user = await authService.verifyOtp(otp, email);
      setUser(user);

      const roleName = user.accountResponse?.roleName;
      console.log("Detected role:", roleName);

      if (roleName === "ROLE_ADMIN") navigate("/admin");
      else if (roleName === "ROLE_MANAGER") navigate("/manager");
      else if (roleName === "ROLE_STAFF") navigate("/staff");
      else if (roleName === "ROLE_TECHNICIAN") navigate("/technician");
      else if (roleName === "ROLE_STOREKEEPER") navigate("/storekeeper");
      else navigate("/");
      return user;
    } catch (error) {
      console.error("Verify OTP failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
