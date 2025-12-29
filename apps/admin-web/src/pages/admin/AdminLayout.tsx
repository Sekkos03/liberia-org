import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Images,
  Megaphone,
  Users,
  MessageSquare,
  LogOut,
  Search,
  PanelLeft,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

export default function AdminLayout() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin.sidebar.collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("admin.sidebar.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const items: Item[] = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { to: "/events", label: "Events", icon: <Calendar size={18} /> },
      { to: "/albums", label: "Albums", icon: <Images size={18} /> },
      { to: "/adverts", label: "Adverts", icon: <Megaphone size={18} /> },
      { to: "/membership", label: "Membership", icon: <Users size={18} /> },
      { to: "/suggestions", label: "Suggestions", icon: <MessageSquare size={18} /> },
    ],
    []
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => x.label.toLowerCase().includes(s));
  }, [items, q]);

  const pageTitle = useMemo(() => {
    const hit = items.find((x) => loc.pathname === x.to);
    if (hit) return hit.label;
    if (loc.pathname.startsWith("/admin/albums/")) return "Album detail";
    return "Admin";
  }, [items, loc.pathname]);

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(1000px_circle_at_10%_0%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(900px_circle_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),linear-gradient(180deg,#050a16,#070f22)]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={[
            "sticky top-0 h-screen shrink-0 border-r border-white/10",
            "bg-[rgba(7,15,34,0.72)] backdrop-blur-xl",
            "transition-all duration-300",
            collapsed ? "w-[76px]" : "w-[280px]",
          ].join(" ")}
        >
          {/* Brand */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 grid place-items-center shadow">
                <span className="font-black tracking-wide">U</span>
              </div>

              {!collapsed && (
                <div className="leading-tight">
                  <div className="font-extrabold text-lg">ULAN Admin</div>
                  <div className="text-xs text-white/60">Control center</div>
                </div>
              )}
            </div>

            <button
              className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <PanelLeft size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={collapsed ? "" : "Search…"}
                className={[
                  "w-full rounded-xl border border-white/10 bg-white/5",
                  "pl-9 pr-3 py-2 outline-none",
                  "focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400/40",
                  "transition",
                ].join(" ")}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 space-y-1">
            {filtered.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5",
                    "transition-all duration-200",
                    "hover:bg-white/10 hover:-translate-y-[1px]",
                    "active:translate-y-0 active:scale-[0.99]",
                    isActive
                      ? "bg-white/12 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      : "border border-transparent",
                  ].join(" ")
                }
              >
                <span className="text-white/80 group-hover:text-white transition">{it.icon}</span>
                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{it.label}</span>
                    {it.badge && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
                        {it.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <button
              onClick={() => {
                logout();
                nav("/login", { replace: true });
              }}
              className={[
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5",
                "border border-white/10 bg-white/5 hover:bg-white/10",
                "transition active:scale-[0.99]",
              ].join(" ")}
            >
              <LogOut size={18} className="text-white/80" />
              {!collapsed && <span className="font-medium">Log out</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(7,15,34,0.55)] backdrop-blur-xl">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs text-white/60">Admin</div>
                <div className="text-xl font-extrabold truncate">{pageTitle}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-xs text-white/60">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
         <main className="px-6 py-6 w-full">
  <div className="w-full">
    <Outlet />
  </div>
</main>

        </div>
      </div>
    </div>
  );
}
