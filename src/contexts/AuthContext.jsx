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
      const user = await authService.login(email, password);
      setUser(user);

      const roleName = user.accountResponse?.roleName;
      console.log("Detected role:", roleName);

      if (roleName === "ROLE_ADMIN") navigate("/admin");
      else if (roleName === "ROLE_STAFF") navigate("/staff");
      else if (roleName === "ROLE_TECHNICIAN") navigate("/technician");
      else navigate("/");
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
      else if (roleName === "ROLE_STAFF") navigate("/staff");
      else if (roleName === "ROLE_TECHNICIAN") navigate("/technician");
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
