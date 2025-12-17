import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  
  if (!user) return <Navigate to="/login" replace />;
  
  const roleName = user.accountResponse?.roleName;
  
  if (allowedRoles && roleName && !allowedRoles.includes(roleName)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
