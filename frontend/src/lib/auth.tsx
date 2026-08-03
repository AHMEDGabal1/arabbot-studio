import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { getMe } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const u = await getMe();
      setUser(u);
    } catch (err: unknown) {
      // Only clear tokens on explicit 401 (unauthorized), not on transient network errors
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
      // On network errors, keep tokens and let user retry
    } finally {
      setLoading(false);
    }
  };

  // ponytail: JWT is the only auth mechanism; Supabase client is used solely for
  // optional file storage, never for sessions, so there is no session listener to wire.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
