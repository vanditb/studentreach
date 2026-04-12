"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabaseCredentials, createBrowserSupabaseClient } from "@/lib/supabase";
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/storage";
import { type AuthCredentials, type SessionUser } from "@/types";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login(credentials: AuthCredentials): Promise<void>;
  signup(credentials: AuthCredentials): Promise<void>;
  continueAsDemo(): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const demoUser: SessionUser = {
  id: "demo-user",
  email: "demo@studentreach.app",
  name: "Demo Student",
  mode: "demo",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = readStorage<SessionUser | null>(STORAGE_KEYS.auth, null);
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const nextUser: SessionUser = {
          id: data.session.user.id,
          email: data.session.user.email ?? "",
          name: data.session.user.user_metadata.full_name ?? data.session.user.email ?? "Student",
          mode: "supabase",
        };
        setUser(nextUser);
        writeStorage(STORAGE_KEYS.auth, nextUser);
      }
      setLoading(false);
    });
  }, []);

  async function login(credentials: AuthCredentials) {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) {
        throw error;
      }
      const nextUser: SessionUser = {
        id: data.user.id,
        email: data.user.email ?? credentials.email,
        name: data.user.user_metadata.full_name ?? credentials.email.split("@")[0],
        mode: "supabase",
      };
      setUser(nextUser);
      writeStorage(STORAGE_KEYS.auth, nextUser);
      return;
    }

    const fallbackUser: SessionUser = {
      id: "local-user",
      email: credentials.email,
      name: credentials.email.split("@")[0],
      mode: "demo",
    };
    setUser(fallbackUser);
    writeStorage(STORAGE_KEYS.auth, fallbackUser);
  }

  async function signup(credentials: AuthCredentials) {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name,
          },
        },
      });
      if (error) {
        throw error;
      }
      const nextUser: SessionUser = {
        id: data.user?.id ?? "pending-user",
        email: credentials.email,
        name: credentials.name ?? credentials.email.split("@")[0],
        mode: "supabase",
      };
      setUser(nextUser);
      writeStorage(STORAGE_KEYS.auth, nextUser);
      return;
    }

    const fallbackUser: SessionUser = {
      id: "local-signup-user",
      email: credentials.email,
      name: credentials.name ?? credentials.email.split("@")[0],
      mode: "demo",
    };
    setUser(fallbackUser);
    writeStorage(STORAGE_KEYS.auth, fallbackUser);
  }

  async function continueAsDemo() {
    setUser(demoUser);
    writeStorage(STORAGE_KEYS.auth, demoUser);
  }

  async function logout() {
    const supabase = createBrowserSupabaseClient();
    if (supabase && hasSupabaseCredentials) {
      await supabase.auth.signOut();
    }
    setUser(null);
    writeStorage(STORAGE_KEYS.auth, null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      continueAsDemo,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
