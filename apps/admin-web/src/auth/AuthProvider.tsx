// admin-web/src/auth/AuthProvider.tsx
import { createContext, useContext, useMemo, useState } from "react";
import { apiPost, setToken, getToken } from "../lib/api";

type AuthCtx = {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());

  const value = useMemo<AuthCtx>(
    () => ({
      token,
      async login(username, password) {
        const res = await apiPost<{ token: string }>("/api/auth/login", {
          username,
          password,
        });
        setToken(res.token);
        setTok(res.token);
      },
      logout() {
        setToken(null);
        setTok(null);
      },
    }),
    [token]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
