import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const RoleRoute = ({ allow, children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.role) ? children : <Navigate to={user.role === 'doctor' ? "/doctor/dashboard" : "/dashboard"} replace />;
};

export default RoleRoute;
