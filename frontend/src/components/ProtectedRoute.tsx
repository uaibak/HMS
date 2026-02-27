import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppAction, AppModule, can } from '../utils/permissions';

export function ProtectedRoute({
  children,
  roles,
  permission,
}: {
  children: React.ReactNode;
  roles?: string[];
  permission?: { module: AppModule; action: AppAction };
}) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles?.length && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !can(user?.role, permission.module, permission.action)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
