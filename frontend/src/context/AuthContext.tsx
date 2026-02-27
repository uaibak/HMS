import { createContext, useContext, useMemo, useState } from 'react';
import { login as loginApi } from '../services/api';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  doctorId?: string | null;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('hms_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('hms_user');
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      async login(email: string, password: string) {
        const response = await loginApi(email, password);
        setToken(response.accessToken);
        setUser(response.user);
        localStorage.setItem('hms_token', response.accessToken);
        localStorage.setItem('hms_user', JSON.stringify(response.user));
      },
      logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
