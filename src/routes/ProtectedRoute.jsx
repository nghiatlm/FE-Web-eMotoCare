// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Nếu chưa đăng nhập, redirect về login
  if (!user) return <Navigate to="/login" replace />;
  
  // Lấy role từ accountResponse?.roleName thay vì user.role
  const roleName = user.accountResponse?.roleName;
  
  // Nếu có allowedRoles và role không nằm trong danh sách, redirect về login
  if (allowedRoles && roleName && !allowedRoles.includes(roleName)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
