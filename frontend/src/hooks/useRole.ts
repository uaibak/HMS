import { useAuth } from '../context/AuthContext';

export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role,
    hasRole: (...roles: string[]) => !!user?.role && roles.includes(user.role),
  };
}
