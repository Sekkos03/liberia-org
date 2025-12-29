// admin-web/src/pages/Login.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";

export default function Login() {
  const isLocal = useMemo(
    () => (/^(localhost|127\.0\.0\.1|::1)$/).test(window.location.hostname),
    []
  );

  const [u, setU] = useState(isLocal ? "admin" : "");
  const [p, setP] = useState(isLocal ? "Admin123!" : "");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [glow, setGlow] = useState({ x: 50, y: 40 });

  // API base (samme som før)
  const API_BASE =
    (import.meta as any).env?.VITE_API_BASE ??
    (isLocal ? "http://localhost:8080" : "https://liberia-org.onrender.com");

  // Mouse-parallax glow (immersive)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      setGlow({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove as any);
  }, []);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [shake]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const username = u.trim();
    const password = p;

    if (!username || !password) {
      setErr("Please enter username and password.");
      setShake(true);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Login failed (${res.status})`);
      }

      const data: { token: string } = await res.json();
      login(data.token);

      const redirectTo = (loc.state as any)?.from?.pathname ?? "/dashboard";
      nav(redirectTo, { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
      setShake(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-screen overflow-hidden text-white bg-[radial-gradient(1100px_circle_at_15%_10%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(900px_circle_at_85%_30%,rgba(16,185,129,0.16),transparent_55%),linear-gradient(180deg,#050a16,#070f22)]">
      {/* Animated ambient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 -left-32 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl animate-[floaty_10s_ease-in-out_infinite]" />
        <div className="absolute top-40 -right-24 h-[520px] w-[520px] rounded-full bg-emerald-500/16 blur-3xl animate-[floaty_12s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-[-180px] left-[20%] h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-3xl animate-[floaty_14s_ease-in-out_infinite]" />
      </div>

      <div className="relative min-h-[100dvh] flex items-center justify-center px-6 py-10">

        <div
          ref={cardRef}
          className={[
            "w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6",
            "rounded-3xl border border-white/10",
            "bg-[rgba(10,18,36,.58)] backdrop-blur-xl",
            "shadow-[0_30px_80px_rgba(0,0,0,.45)]",
            "p-6 md:p-8",
          ].join(" ")}
          style={{
            backgroundImage: `radial-gradient(900px circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.08), transparent 55%)`,
          }}
        >
          {/* Left / Branding */}
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 grid place-items-center shadow">
                <ShieldCheck size={20} className="text-emerald-200" />
              </div>
              <div>
                <div className="text-xs text-white/60">ULAN</div>
                <div className="text-lg font-extrabold tracking-tight">Admin Control Center</div>
              </div>
            </div>

            <h1 className="mt-6 text-3xl md:text-4xl font-black leading-tight">
              Secure access for content management.
            </h1>
            <p className="mt-3 text-white/70 leading-relaxed">
              Log in to manage events, adverts, albums and membership. Smooth workflow,
              faster publishing, better overview.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Modules</div>
                <div className="mt-1 font-semibold">Events · Albums</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Security</div>
                <div className="mt-1 font-semibold">Token session</div>
              </div>
            </div>

            <div className="mt-6 text-xs text-white/50">
              Tip: Use a strong password. Avoid logging in on public computers.
            </div>
          </section>

          {/* Right / Form */}
          <section className="flex items-center">
            <form
              onSubmit={onSubmit}
              className={[
                "w-full rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8",
                shake ? "animate-[shake_.45s_ease-in-out]" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-white/60">Admin</div>
                  <h2 className="text-2xl md:text-3xl font-extrabold">Sign in</h2>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
                  {isLocal ? "LOCAL" : "PROD"}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {/* Username */}
                <label className="block">
                  <span className="text-sm text-white/70">Username</span>
                  <div className="mt-2 relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/55" />
                    <input
                      className={[
                        "w-full rounded-xl border border-white/10 bg-[rgba(0,0,0,.25)]",
                        "pl-10 pr-3 py-2.5 outline-none",
                        "focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400/40",
                        "transition",
                      ].join(" ")}
                      value={u}
                      onChange={(e) => setU(e.target.value)}
                      autoComplete="username"
                      placeholder="Enter username"
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="text-sm text-white/70">Password</span>
                  <div className="mt-2 relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/55" />
                    <input
                      className={[
                        "w-full rounded-xl border border-white/10 bg-[rgba(0,0,0,.25)]",
                        "pl-10 pr-12 py-2.5 outline-none",
                        "focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400/35",
                        "transition",
                      ].join(" ")}
                      type={show ? "text" : "password"}
                      value={p}
                      onChange={(e) => setP(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter password"
                    />

                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 active:scale-95 transition"
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                {err && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={[
                    "mt-2 w-full rounded-xl px-4 py-3 font-semibold",
                    "border border-white/10",
                    "bg-[linear-gradient(135deg,rgba(99,102,241,.35),rgba(16,185,129,.20))]",
                    "hover:brightness-110 hover:-translate-y-[1px]",
                    "active:translate-y-0 active:scale-[0.99]",
                    "transition shadow-[0_18px_50px_rgba(0,0,0,.45)]",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                  ].join(" ")}
                >
                  {busy ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>

                <div className="text-xs text-white/50 text-center pt-2">
                  Authorized personnel only.
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* local keyframes */}
      <style>{`
        @keyframes floaty {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(0,-18px,0) scale(1.03); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes shake {
          0%,100%{ transform: translateX(0); }
          20%{ transform: translateX(-6px); }
          40%{ transform: translateX(6px); }
          60%{ transform: translateX(-4px); }
          80%{ transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
