import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ContactModal from "./ContactModal";

type NavItem = { to: string; label: string };

const links: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/membership", label: "Forms" },
  { to: "/events", label: "Events" },
  { to: "/adverts", label: "Adverts" },
  { to: "/photos", label: "Photos" },
  { to: "/post", label: "Post Box" },
  { to: "/about", label: "About us" },
  // Merk: Contact håndteres som knapp, ikke routing
  { to: "#contact", label: "Contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const openContact = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Lukk mobilmeny om den er åpen
    setOpen(false);
    // Fyr globalt event som ContactModal lytter på
    window.dispatchEvent(new CustomEvent("contact:open"));
  };

  const linkClasses = (active: boolean) =>
    `hover:text-emerald-400 transition ${
      active ? "text-emerald-400 font-medium" : "text-white"
    }`;

  return (
    <>
      <header className="bg-[#1f2a44] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="hidden sm:inline">Liberia Org</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6">
            {links.map((l) =>
              l.label === "Contact" ? (
                <button
                  key={l.label}
                  type="button"
                  onClick={openContact}
                  className={linkClasses(false) + " cursor-pointer"}
                  aria-haspopup="dialog"
                  aria-controls="contact"
                >
                  {l.label}
                </button>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  className={linkClasses(pathname === l.to)}
                >
                  {l.label}
                </Link>
              )
            )}
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
              {links.map((l) =>
                l.label === "Contact" ? (
                  <button
                    key={l.label}
                    type="button"
                    onClick={openContact}
                    className="block text-left py-2 px-2 rounded hover:bg-white/10 text-white"
                    aria-haspopup="dialog"
                    aria-controls="contact"
                  >
                    {l.label}
                  </button>
                ) : (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`block py-2 px-2 rounded hover:bg:white/10 ${
                      pathname === l.to ? "text-emerald-400 font-medium" : "text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Modalen rendres globalt én gang her, tilgjengelig på alle sider */}
      <ContactModal
        phone="+47 12 34 56 78"
        email="post@liberia-org.no"
        account="1503.45.67890"
        vipps="123456"
        org="999 999 999"
      />
    </>
  );
}
