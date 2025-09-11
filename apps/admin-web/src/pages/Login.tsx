// admin-web/src/pages/Login.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("Admin123!");
  const [err, setErr] = useState<string | null>(null);

  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Login failed (${res.status})`);
      }
      const data: { token: string } = await res.json();
      login(data.token);

      // go back where we came from or to events
      const redirectTo = (loc.state as any)?.from?.pathname ?? "/dashboard";
      nav(redirectTo, { replace: true });
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Admin login</h1>

        <label className="block">
          <span className="text-sm">Username</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="block">
          <span className="text-sm">Password</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button
          type="submit"
          className="w-full rounded px-3 py-2 border"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
