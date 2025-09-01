// admin-web/src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthCtx = {
  token: string | null;
  isAuthed: boolean;
  login: (jwt: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  // load persisted token on boot
  useEffect(() => {
    const t = localStorage.getItem("jwt");
    if (t) setToken(t);
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    token,
    isAuthed: !!token,
    login: (jwt: string) => {
      setToken(jwt);
      localStorage.setItem("jwt", jwt);
    },
    logout: () => {
      setToken(null);
      localStorage.removeItem("jwt");
    },
  }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
