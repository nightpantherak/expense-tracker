import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, clearToken, getToken } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) { setUser(null); return; }
      const me = await api.me();
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    await setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (email, password, name) => {
    const res = await api.register({ email, password, name });
    await setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
