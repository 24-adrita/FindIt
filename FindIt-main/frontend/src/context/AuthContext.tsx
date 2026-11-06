"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, AuthResponse } from "../types/item";
import { fetchCurrentUser, loginUser, registerUser, googleLoginUser } from "../services/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    phone?: string;
  }) => Promise<void>;
  googleLogin: (payload?: { email?: string; name?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "findit_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    async function initAuth() {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await fetchCurrentUser(storedToken);
        setUser(profile);
        setToken(storedToken);
      } catch (err) {
        console.warn("Stored auth token was invalid or expired. Clearing session.", err);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res: AuthResponse = await loginUser(credentials);
    if (res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    phone?: string;
  }) => {
    const res: AuthResponse = await registerUser(userData);
    if (res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const googleLogin = async (payload?: { email?: string; name?: string }) => {
    const res: AuthResponse = await googleLoginUser(payload);
    if (res.token && res.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
