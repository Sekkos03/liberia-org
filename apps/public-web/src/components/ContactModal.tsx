import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

export type ContactModalProps = {
  phone?: string;
  email?: string;
  account?: string;
  vipps?: string;
  org?: string;
  badgeContent?: React.ReactNode;
};

export default function ContactModal({
  phone = "",              // tom som i skissen; fyll inn fra Navbar ved behov
  email = "",
  account = "",
  vipps = "",
  org = "",
  badgeContent,
}: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Åpne/lukke via globale events
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("contact:open", onOpen);
    window.addEventListener("contact:close", onClose);
    return () => {
      window.removeEventListener("contact:open", onOpen);
      window.removeEventListener("contact:close", onClose);
    };
  }, []);

  // Fokus & ESC når åpen
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 10);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="cModal__mask"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contactTitle"
      onClick={() => setOpen(false)}
    >
      <div
        className="cModal__card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cModal__head">
          <h2 id="contactTitle">Contact us</h2>
          <button
            className="cModal__close"
            onClick={() => setOpen(false)}
            ref={closeBtnRef}
            aria-label="Close contact"
          >
            ✕
          </button>
        </div>

        {/* Ny layout: én liste (rad for rad) + badge til høyre */}
        <div className="cModal__grid">
          <ul className="cList" aria-label="Kontaktinformasjon">
            <li className="cRow">
              <span className="cIcon">{phoneSvg}</span>
              <span className="cText">Telefon Number</span>
              <span className="cValue">{phone}</span>
            </li>
            <li className="cRow">
              <span className="cIcon">{mailSvg}</span>
              <span className="cText">Mail</span>
              <span className="cValue">{email}</span>
            </li>
            <li className="cRow">
              <span className="cIcon">{cardSvg}</span>
              <span className="cText">Account Number</span>
              <span className="cValue">{account}</span>
            </li>
            <li className="cRow">
              <span className="cIcon">{vippsSvg}</span>
              <span className="cText">VIPPS</span>
              <span className="cValue">{vipps}</span>
            </li>
            <li className="cRow">
              <span className="cIcon">{orgSvg}</span>
              <span className="cText">Organization Number</span>
              <span className="cValue">{org}</span>
            </li>
          </ul>

          <div className="cBadge" aria-hidden="true">
            {badgeContent ?? <div className="cCircle" />}
          </div>
        </div>

        <style>{css}</style>
      </div>
    </div>,
    document.body
  );
}

/* ---------- små, rene ikoner ---------- */
const phoneSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z"/>
  </svg>
);
const mailSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
);
const cardSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
  </svg>
);
const vippsSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 12c3 5 13 5 16 0M8 12c1.5 2.5 6.5 2.5 8 0" />
  </svg>
);
const orgSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18M15 7h2M15 11h2M15 15h2"/>
  </svg>
);

/* ---------- CSS: prikk lik skissen ---------- */
const css = `
.cModal__mask{
  position:fixed;inset:0;background:rgba(0,0,0,.5);
  display:grid;place-items:center;z-index:70;
}
.cModal__card{
  width:min(640px,94vw);
  background:#fff;border:2px solid #0e1f3b;border-radius:8px;
  box-shadow:0 10px 30px rgba(0,0,0,.25);
  padding:14px 16px 18px; transform:scale(.98); animation:pop .12s ease-out forwards;
}
@keyframes pop{to{transform:scale(1)}}

.cModal__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.cModal__head h2{font-size:20px;font-weight:800;margin:0;color:#0f1d37}
.cModal__close{
  background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;
  height:32px;width:32px;cursor:pointer;display:grid;place-items:center
}

/* Én liste venstre + badge høyre */
.cModal__grid{
  display:grid;grid-template-columns:1fr 160px;gap:8px 20px;align-items:center;
}
@media (max-width: 560px){ .cModal__grid{ grid-template-columns:1fr; } }

.cList{list-style:none;margin:6px 0 0 0;padding:0}
.cRow{
  display:grid;grid-template-columns:22px auto 1fr;gap:12px;align-items:center;
  padding:8px 0;
}
.cIcon{color:#0f1d37;opacity:.95;display:grid;place-items:center}
.cText{color:#111827;font-weight:600;font-size:14px}
.cValue{color:#111827;font-size:14px;justify-self:start}

.cBadge{display:grid;place-items:center}
.cCircle{width:160px;height:160px;border-radius:999px;background:#1f2f58}
/* logo i badge (fra props) */
.cBadge img, .cBadge__img{
  width:150px;height:150px;object-fit:contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.25));
}`;
