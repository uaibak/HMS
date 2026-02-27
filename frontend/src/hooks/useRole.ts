import { useAuth } from './useAuth';

export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role,
    hasRole: (...roles: string[]) => !!user?.role && roles.includes(user.role),
  };
}
