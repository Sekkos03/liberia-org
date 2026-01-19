import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ContactModal from "./ContactModal";
import UlanLogo from "../assets/Ulan_logo-removebg-preview.png";

type NavItem = { to: string; label: string };

const links: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/membership", label: "Forms" },
  { to: "/events", label: "Events" },
  { to: "/adverts", label: "Adverts" },
  { to: "/albums", label: "Albums" },
  { to: "/post", label: "Post Box" },
  { to: "/about", label: "About us" },
  { to: "/donate", label: "Donate" },
  { to: "#contact", label: "Contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openContact = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setOpen(false);
    window.dispatchEvent(new CustomEvent("contact:open"));
  };

  const navLinkBase =
    "relative inline-flex items-center px-2 py-1 rounded-full " +
    "transition-all duration-200 ease-out " +
    "hover:text-emerald-200 hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60";

  const underline =
    "after:content-[''] after:absolute after:left-2 after:right-2 after:-bottom-1 " +
    "after:h-[2px] after:rounded-full after:bg-emerald-300 " +
    "after:origin-left after:scale-x-0 after:transition-transform after:duration-200 " +
    "hover:after:scale-x-100";

  const linkClasses = (active: boolean) =>
    [
      navLinkBase,
      underline,
      active ? "text-emerald-300 bg-white/10 after:scale-x-100" : "text-white/95",
    ].join(" ");

  return (
    <>
      <header
        className={[
          "sticky top-0 z-50 text-white",
          "transition-all duration-300",
          scrolled
            ? "bg-[#1f2a44]/75 backdrop-blur-md shadow-lg"
            : "bg-[#1f2a44] shadow-md",
        ].join(" ")}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="Liberian Organization in Norway – Home"
          >
            <img
              src={UlanLogo}
              alt="ULAN – Union of Liberian Associations in Norway"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow transition-transform duration-200 group-hover:scale-[1.04]"
            />
            <span className="sr-only">Liberian Organization in Norway</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-4 items-center">
            {links.map((l) =>
              l.label === "Contact" ? (
                <button
                  key={l.label}
                  type="button"
                  onClick={openContact}
                  className={[
                    navLinkBase,
                    underline,
                    "text-white/95 hover:text-emerald-200",
                  ].join(" ")}
                  aria-haspopup="dialog"
                  aria-controls="contact"
                >
                  Contact
                </button>
              ) : (
                <Link key={l.to} to={l.to} className={linkClasses(pathname === l.to)}>
                  {l.label}
                </Link>
              )
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className={[
              "md:hidden p-2 rounded-lg",
              "transition-all duration-200",
              "hover:bg-white/10 active:scale-95",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
            ].join(" ")}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className={`inline-block transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"}`}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </span>
          </button>
        </div>

        {/* Mobile menu (smooth) */}
        <nav
          className={[
            "md:hidden overflow-hidden border-t border-white/10",
            "transition-all duration-300 ease-out",
            open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="flex flex-col px-4 py-2">
            {links.map((l) =>
              l.label === "Contact" ? (
                <button
                  key={l.label}
                  type="button"
                  onClick={openContact}
                  className={[
                    "text-left py-1.5 px-3 rounded-lg",
                    "text-white/95",
                    "transition-all duration-200",
                    "hover:bg-white/10 hover:text-emerald-200 active:scale-[0.99]",
                  ].join(" ")}
                  aria-haspopup="dialog"
                  aria-controls="contact"
                >
                  Contact
                </button>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={[
                    "block py-1.5 px-3 rounded-lg",
                    "transition-all duration-200",
                    "hover:bg-white/10 hover:text-emerald-200 active:scale-[0.99]",
                    pathname === l.to ? "bg-white/10 text-emerald-300 font-medium" : "text-white/95",
                  ].join(" ")}
                >
                  {l.label}
                </Link>
              )
            )}
          </div>
        </nav>
      </header>

      <ContactModal
        phone="+47 12 34 56 78"
        email="post@liberia-org.no"
        account="1503.45.67890"
        vipps="123456"
        org="999 999 999"
        badgeContent={<img src={UlanLogo} alt="" className="cBadge__img" />}
      />
    </>
  );
}