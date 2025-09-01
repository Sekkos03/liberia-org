// public-web/src/App.tsx
import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const { pathname } = useLocation();
  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded ${pathname === to ? "bg-black text-white" : "hover:bg-black/10"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto p-3 flex gap-2 flex-wrap">
          <NavLink to="/" label="Hjem" />
          <NavLink to="/events" label="Arrangement" />
          <NavLink to="/photos" label="Bilder" />
          <NavLink to="/adverts" label="Annonser" />
          <NavLink to="/forms" label="Medlemskap" />
          <NavLink to="/post" label="Forslag" />
          <NavLink to="/about" label="Om oss" />
          <NavLink to="/contact" label="Kontakt" />
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-5xl mx-auto p-4">
          <Outlet />
        </div>
      </main>
      <footer className="border-t text-sm text-gray-500 p-4 text-center">
        © Liberia Org
      </footer>
    </div>
  );
}
