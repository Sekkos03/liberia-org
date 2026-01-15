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
  PanelRight,
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin.sidebar.collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem("admin.sidebar.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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

  // Sidebar content component to avoid duplication
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Brand */}
      <div className={`flex items-center px-4 py-4 ${collapsed && !isMobile ? "justify-center" : "justify-between"}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 grid place-items-center shadow shrink-0">
            <span className="font-black tracking-wide">U</span>
          </div>

          {(!collapsed || isMobile) && (
            <div className="leading-tight">
              <div className="font-extrabold text-lg">ULAN Admin</div>
              <div className="text-xs text-white/60">Control center</div>
            </div>
          )}
        </div>

        {/* Close button for mobile */}
        {isMobile && (
          <button
            className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition"
            onClick={() => setMobileOpen(false)}
            title="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Expand/Collapse button - only on desktop, positioned better when collapsed */}
      {!isMobile && (
        <div className={`px-3 pb-3 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            className={`p-2 rounded-xl hover:bg-white/10 active:scale-95 transition border border-white/10 ${
              collapsed ? "w-10 h-10 flex items-center justify-center" : "w-full flex items-center gap-2"
            }`}
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelRight size={18} />
            ) : (
              <>
                <PanelLeft size={18} />
                <span className="text-sm text-white/70">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Search */}
      {(!collapsed || isMobile) && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className={[
                "w-full rounded-xl border border-white/10 bg-white/5",
                "pl-9 pr-3 py-2 outline-none",
                "focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400/40",
                "transition",
              ].join(" ")}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
        {filtered.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3 py-2.5",
                "transition-all duration-200",
                "hover:bg-white/10 hover:-translate-y-[1px]",
                "active:translate-y-0 active:scale-[0.99]",
                collapsed && !isMobile ? "justify-center" : "",
                isActive
                  ? "bg-white/12 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                  : "border border-transparent",
              ].join(" ")
            }
            title={collapsed && !isMobile ? it.label : undefined}
          >
            <span className="text-white/80 group-hover:text-white transition shrink-0">{it.icon}</span>
            {(!collapsed || isMobile) && (
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
      <div className="p-3 border-t border-white/10 mt-auto">
        <button
          onClick={() => {
            logout();
            nav("/login", { replace: true });
          }}
          className={[
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5",
            "border border-white/10 bg-white/5 hover:bg-white/10",
            "transition active:scale-[0.99]",
            collapsed && !isMobile ? "justify-center" : "",
          ].join(" ")}
          title={collapsed && !isMobile ? "Log out" : undefined}
        >
          <LogOut size={18} className="text-white/80 shrink-0" />
          {(!collapsed || isMobile) && <span className="font-medium">Log out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(1000px_circle_at_10%_0%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(900px_circle_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),linear-gradient(180deg,#050a16,#070f22)]">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          className={[
            "hidden md:flex flex-col",
            "sticky top-0 h-screen shrink-0 border-r border-white/10",
            "bg-[rgba(7,15,34,0.72)] backdrop-blur-xl",
            "transition-all duration-300",
            collapsed ? "w-[72px]" : "w-[260px]",
          ].join(" ")}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-50"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={[
            "md:hidden fixed top-0 left-0 h-full w-[280px] z-50",
            "flex flex-col",
            "border-r border-white/10",
            "bg-[rgba(7,15,34,0.95)] backdrop-blur-xl",
            "transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <SidebarContent isMobile />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <div className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(7,15,34,0.55)] backdrop-blur-xl">
            <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-white/10 active:scale-95 transition border border-white/10"
                onClick={() => setMobileOpen(true)}
                title="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="text-xs text-white/60">Admin</div>
                <div className="text-lg md:text-xl font-extrabold truncate">{pageTitle}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-xs text-white/60">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="px-4 md:px-6 py-4 md:py-6 w-full">
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}