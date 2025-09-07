import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/membership", label: "Forms" },
  { to: "/events", label: "Events" },
  { to: "/adverts", label: "Adverts" },
  { to: "/photos", label: "Photos" },
  { to: "/post", label: "Post" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-[#1f2a44] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="hidden sm:inline">Liberia Org</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`hover:text-emerald-400 transition ${
                pathname === l.to ? "text-emerald-400 font-medium" : "text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/10"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-[#1f2a44] border-t border-white/10">
          <div className="flex flex-col px-4 py-2 space-y-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block py-2 px-2 rounded hover:bg-white/10 ${
                  pathname === l.to ? "text-emerald-400 font-medium" : "text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
