import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
  const { loading, user, roles } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && !roles.some((r) => r.role.toLowerCase().includes(requireRole.toLowerCase()))) {
    return <Navigate to="/" replace />;
  }
  return children;
}





