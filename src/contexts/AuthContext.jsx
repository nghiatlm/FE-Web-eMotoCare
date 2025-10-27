// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const user = await authService.login(phone, password);
      setUser(user);

      const roleName = user.accountResponse?.roleName;
      console.log("Detected role:", roleName);

      if (roleName === "ROLE_ADMIN") navigate("/admin");
      else if (roleName === "ROLE_STAFF") navigate("/staff");
      else if (roleName === "ROLE_TECHINICIAN") navigate("/technician");
      else navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
