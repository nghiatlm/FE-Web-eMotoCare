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
      
      const responseData = response?.data;
      const isDataString = typeof responseData === 'string';
      const hasOtpMessage = isDataString && responseData.toUpperCase().includes('OTP');

      if (hasOtpMessage) {
        localStorage.setItem("pendingEmail", email);
        
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
          state: { email },
          replace: true
        });
        return response;
      }

      const user = response?.accountResponse ? response : (response?.data || response);
      
      if (user?.accountResponse) {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        
        const roleName = user.accountResponse.roleName;

        if (roleName === "ROLE_ADMIN") navigate("/admin");
        else if (roleName === "ROLE_STAFF") navigate("/staff");
        else if (roleName === "ROLE_MANAGER") navigate("/manager");
        else if (roleName === "ROLE_TECHNICIAN") navigate("/technician");
        else if (roleName === "ROLE_STOREKEEPER") navigate("/storekeeper");
        else navigate("/");
      } else {
        localStorage.setItem("pendingEmail", email);
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
          state: { email },
          replace: true
        });
      }
      
      return response;
    } catch (error) {
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

      if (roleName === "ROLE_ADMIN") navigate("/admin");
      else if (roleName === "ROLE_MANAGER") navigate("/manager");
      else if (roleName === "ROLE_STAFF") navigate("/staff");
      else if (roleName === "ROLE_TECHNICIAN") navigate("/technician");
      else if (roleName === "ROLE_STOREKEEPER") navigate("/storekeeper");
      else navigate("/");
      return user;
    } catch (error) {
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
