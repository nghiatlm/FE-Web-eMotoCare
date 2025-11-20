// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to='/login' replace />;

  const userRole =
    user?.accountResponse?.roleName ||
    user?.role ||
    user?.roleName ||
    user?.accountResponse?.role;

  if (allowedRoles && !allowedRoles.includes(userRole))
    return <Navigate to='/login' replace />;

  return children;
}
