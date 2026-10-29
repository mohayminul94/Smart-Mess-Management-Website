'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      if (data?.success && data?.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smart_mess_user', JSON.stringify(data.user));
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('smart_mess_token');
        localStorage.removeItem('smart_mess_user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Auth routing protection
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = pathname === '/login' || pathname === '/';
      if (!user && !isPublicRoute) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res?.success) {
        setUser(res.user);
        if (typeof window !== 'undefined') {
          if (res.token) localStorage.setItem('smart_mess_token', res.token);
          localStorage.setItem('smart_mess_user', JSON.stringify(res.user));
        }
        toast.success(`Welcome back, ${res.user.name}!`);
        router.push('/dashboard');
        return { success: true };
      }
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout request errors
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('smart_mess_token');
        localStorage.removeItem('smart_mess_user');
      }
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
