// src/contexts/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { TeacherLoginDto, Role } from '@/types/auth';

interface CurrentUser {
  _id: string;
  username: string;
  fullName: string;
  isActive: boolean;
  isOwner: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  token: string | null;
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: TeacherLoginDto) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid user - clear it
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials: TeacherLoginDto): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.teacherLogin(credentials);

      if (response.error || !response.data) {
        setIsLoading(false);
        return false;
      }

      const { accessToken, teacher } = response.data;

      // Store in state
      setToken(accessToken);
      setUser(teacher as unknown as CurrentUser);

      // Store in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(teacher));

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Try Next.js navigation first
    try {
      router.replace('/auth/login');
    } catch { }
    // Ensure redirect even if router is not ready
    if (typeof window !== 'undefined') {
      window.location.replace('/auth/login');
    }
  };

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}