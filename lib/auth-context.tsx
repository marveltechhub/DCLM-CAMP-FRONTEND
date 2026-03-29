'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@/lib/api';
import { getStoredToken, loginRequest, meRequest } from '@/lib/api';

function normalizeAuthUser(u: {
  id?: unknown;
  _id?: unknown;
  name: string;
  email: string;
  role: string;
  location?: { _id?: unknown; name: string; code?: string } | null;
}): AuthUser {
  const id = u.id ?? u._id;
  return {
    id: String(id),
    name: u.name,
    email: u.email,
    role: u.role as AuthUser['role'],
    location: u.location
      ? {
          _id: String(u.location._id),
          name: u.location.name,
          code: u.location.code,
        }
      : null,
  };
}

type Ctx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await meRequest(t);
      setUser(normalizeAuthUser(u as Parameters<typeof normalizeAuthUser>[0]));
      setToken(t);
    } catch {
      localStorage.removeItem('dclm_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t);
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const { token: tok, user: u } = await loginRequest(email, password);
    localStorage.setItem('dclm_token', tok);
    setToken(tok);
    setUser(normalizeAuthUser(u as Parameters<typeof normalizeAuthUser>[0]));
  };

  const logout = () => {
    localStorage.removeItem('dclm_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
