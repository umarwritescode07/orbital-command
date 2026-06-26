"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role rank mappings to implement hierarchy checks
const ROLE_RANKS: Record<UserRole, number> = {
  ADMIN: 3,
  OPERATOR: 2,
  VIEWER: 1,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Perform initial session identification check
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to restore operator auth session", err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        router.push("/dashboard");
        router.refresh();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Console access denied." };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Uplink connection error." };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        router.push("/dashboard");
        router.refresh();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Profile generation failed." };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Registration connection error." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Uplink failed to log out cleanly", err);
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const currentRank = ROLE_RANKS[user.role] || 0;
    const requiredRank = ROLE_RANKS[requiredRole] || 0;
    return currentRank >= requiredRank;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be invoked inside an AuthProvider element.");
  }
  return context;
}
