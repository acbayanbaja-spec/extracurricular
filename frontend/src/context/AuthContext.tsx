"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocal: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('cnhs_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = await ApiClient.get<User>('/auth/me');
      setUser(userData);
      localStorage.setItem('cnhs_user', JSON.stringify(userData));
    } catch (error) {
      console.warn('Session expired or invalid. Clearing credentials.');
      localStorage.removeItem('cnhs_access_token');
      localStorage.removeItem('cnhs_refresh_token');
      localStorage.removeItem('cnhs_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Attempt fast hydration from localStorage
    try {
      const cached = localStorage.getItem('cnhs_user');
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } catch {
      // ignore json parse error
    }
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await ApiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { email, password });

      localStorage.setItem('cnhs_access_token', data.accessToken);
      localStorage.setItem('cnhs_refresh_token', data.refreshToken);
      localStorage.setItem('cnhs_user', JSON.stringify(data.user));
      setUser(data.user);

      toast.success(`Welcome back, ${data.user.firstName}!`, {
        description: `Signed in as ${data.user.role.toLowerCase()}`,
      });

      // Role-based routing
      if (data.user.role === 'ADMINISTRATOR') {
        router.push('/admin');
      } else if (data.user.role === 'TEACHER') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }

      return true;
    } catch (err: any) {
      toast.error('Authentication Failed', {
        description: err.message || 'Please check your email and password.',
      });
      return false;
    }
  };

  const logout = () => {
    try {
      ApiClient.post('/auth/logout').catch(() => {});
    } catch {}

    localStorage.removeItem('cnhs_access_token');
    localStorage.removeItem('cnhs_refresh_token');
    localStorage.removeItem('cnhs_user');
    setUser(null);
    toast.info('Signed out', { description: 'You have been safely logged out.' });
    router.push('/login');
  };

  const updateUserLocal = (updated: Partial<User>) => {
    if (!user) return;
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('cnhs_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        logout,
        refreshUser,
        updateUserLocal,
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
