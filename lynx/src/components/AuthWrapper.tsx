import { useRequireAuth } from "@/hooks/usePocketBase";
import { Outlet, Navigate } from "react-router-dom";

const AuthWrapper = () => {
  const user = useRequireAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AuthWrapper;
