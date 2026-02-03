import { type FormEvent, useMemo, useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { submitSuggestion } from "../lib/postbox";
import DonationPopup from "../components/Donationpopup";
import UlanLogo from "../assets/Ulan_logo-removebg-preview.png";

const MAX_MSG = 2000;

// Kontaktinformasjon - enkelt å oppdatere
const CONTACT_INFO = {
  phone: "+47 966 94 706",
  email: "Uliberians1847@yahoo.com",
  org: "992 826 363",
};

type TabType = "info" | "message";

export default function Contact() {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const hpRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const left = useMemo(() => Math.max(0, MAX_MSG - message.length), [message.length]);

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  function validate(): string | null {
    if (!message.trim()) return "Message cannot be empty.";
    if (message.length > MAX_MSG) return `Message is too long (max ${MAX_MSG} characters).`;
    if (email.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
      if (!ok) return "Invalid email address.";
    }
    if (hpRef.current?.value) return "Could not send the message.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setBusy(true);
      await submitSuggestion({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim(),
      });
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  const contactItems = [
    { key: "phone", icon: PhoneIcon, label: "Phone", value: CONTACT_INFO.phone, action: `tel:${CONTACT_INFO.phone.replace(/\s/g, "")}` },
    { key: "email", icon: MailIcon, label: "Email", value: CONTACT_INFO.email, action: `mailto:${CONTACT_INFO.email}` },
    { key: "org", icon: OrgIcon, label: "Organization Nr.", value: CONTACT_INFO.org },
  ];

  return (
    <div className="contactPage" ref={containerRef}>
      <Navbar />

      {/* Interactive gradient background */}
      <div
        className="contactPage__glow"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(29,78,137,0.15), transparent 40%)`,
        }}
      />

      <main className="contactPage__main">
        {/* Hero Section */}
        <section className="contactHero">
          <div className="contactHero__content">
            <div className="contactHero__badge">
              <img src={UlanLogo} alt="ULAN Logo" className="contactHero__logo" />
            </div>
            <h1 className="contactHero__title">
              <span className="contactHero__titleLine">Get in</span>
              <span className="contactHero__titleLine contactHero__titleLine--accent">Touch</span>
            </h1>
            <p className="contactHero__subtitle">
              We'd love to hear from you. Reach out directly or send us a message.
            </p>
          </div>

          {/* Floating decorative elements */}
          <div className="contactHero__decor contactHero__decor--1" />
          <div className="contactHero__decor contactHero__decor--2" />
          <div className="contactHero__decor contactHero__decor--3" />
        </section>

        {/* Tab Navigation */}
        <div className="contactTabs">
          <button
            className={`contactTabs__btn ${activeTab === "info" ? "contactTabs__btn--active" : ""}`}
            onClick={() => setActiveTab("info")}
            aria-pressed={activeTab === "info"}
          >
            <span className="contactTabs__icon">{InfoIcon}</span>
            <span>Contact Info</span>
          </button>
          <button
            className={`contactTabs__btn ${activeTab === "message" ? "contactTabs__btn--active" : ""}`}
            onClick={() => setActiveTab("message")}
            aria-pressed={activeTab === "message"}
          >
            <span className="contactTabs__icon">{MessageIcon}</span>
            <span>Send Message</span>
          </button>
          <div
            className="contactTabs__indicator"
            style={{ transform: `translateX(${activeTab === "info" ? "0" : "100"}%)` }}
          />
        </div>

        {/* Content Area */}
        <div className="contactContent">
          {/* Contact Info Panel */}
          <div className={`contactPanel ${activeTab === "info" ? "contactPanel--active" : ""}`}>
            <div className="contactInfo">
              <div className="contactInfo__header">
                <h2 className="contactInfo__title">Contact Information</h2>
                <p className="contactInfo__desc">
                  Click any field to copy or use the action buttons to call/email directly.
                </p>
              </div>

              <ul className="contactList">
                {contactItems.map((item, index) => (
                  <li
                    key={item.key}
                    className="contactItem"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="contactItem__icon">
                      <item.icon />
                    </div>
                    <div className="contactItem__content">
                      <span className="contactItem__label">{item.label}</span>
                      <span className="contactItem__value">{item.value}</span>
                    </div>
                    <div className="contactItem__actions">
                      <button
                        className={`contactItem__btn contactItem__btn--copy ${copiedField === item.key ? "contactItem__btn--copied" : ""}`}
                        onClick={() => copyToClipboard(item.value, item.key)}
                        aria-label={`Copy ${item.label}`}
                      >
                        {copiedField === item.key ? CheckIcon : CopyIcon}
                        <span className="contactItem__tooltip">
                          {copiedField === item.key ? "Copied!" : "Copy"}
                        </span>
                      </button>
                      {item.action && (
                        <a
                          href={item.action}
                          className="contactItem__btn contactItem__btn--action"
                          aria-label={item.key === "phone" ? "Call" : "Send email"}
                        >
                          {item.key === "phone" ? CallIcon : SendMailIcon}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Quick Actions */}
              <div className="contactQuick">
                <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`} className="contactQuick__btn contactQuick__btn--call">
                  <span className="contactQuick__icon"><PhoneIcon /></span>
                  <span>Call Us</span>
                </a>
                <a href={`mailto:${CONTACT_INFO.email}`} className="contactQuick__btn contactQuick__btn--email">
                  <span className="contactQuick__icon"><MailIcon /></span>
                  <span>Email Us</span>
                </a>
              </div>
            </div>
          </div>

          {/* Message Form Panel */}
          <div className={`contactPanel ${activeTab === "message" ? "contactPanel--active" : ""}`}>
            <div className="messageForm">
              <div className="messageForm__header">
                <h2 className="messageForm__title">Send us a Message</h2>
                <p className="messageForm__desc">
                  Have a suggestion or question? Let us know — anonymously if you prefer.
                </p>
              </div>

              {/* Privacy Note */}
              <div className="messageForm__privacy">
                <span className="messageForm__privacyIcon">{LockIcon}</span>
                <div>
                  <strong>Your privacy matters</strong>
                  <p>Messages are stored securely. Personal info is optional — add it only if you want a response.</p>
                </div>
              </div>

              {/* Alerts */}
              {sent && (
                <div className="contactAlert contactAlert--success" role="status">
                  <span className="contactAlert__icon">{SuccessIcon}</span>
                  <div>
                    <strong>Thank you!</strong>
                    <p>Your message has been sent successfully.</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="contactAlert contactAlert--error" role="alert">
                  <span className="contactAlert__icon">{ErrorIcon}</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} noValidate className="messageForm__form">
                {/* Honeypot */}
                <input
                  ref={hpRef}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="messageForm__hp"
                  aria-hidden="true"
                />

                <div className="messageForm__row">
                  <label className="messageForm__field">
                    <span className="messageForm__label">
                      <span className="messageForm__labelIcon">{UserIcon}</span>
                      Name <span className="messageForm__optional">(optional)</span>
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="messageForm__input"
                      autoComplete="name"
                      maxLength={140}
                    />
                  </label>

                  <label className="messageForm__field">
                    <span className="messageForm__label">
                      <span className="messageForm__labelIcon">{<MailIcon />}</span>
                      Email <span className="messageForm__optional">(optional)</span>
                    </span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="your@email.com"
                      className="messageForm__input"
                      autoComplete="email"
                      maxLength={140}
                    />
                  </label>
                </div>

                <label className="messageForm__field">
                  <span className="messageForm__label">
                    <span className="messageForm__labelIcon">{PenIcon}</span>
                    Message <span className="messageForm__required">*</span>
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="messageForm__textarea"
                    placeholder="Write your message here..."
                    required
                    maxLength={MAX_MSG}
                  />
                  <div className="messageForm__counter">
                    <span className={left < 100 ? "messageForm__counter--warn" : ""}>
                      {left} characters remaining
                    </span>
                  </div>
                </label>

                <div className="messageForm__actions">
                  <button type="submit" className="messageForm__submit" disabled={busy}>
                    {busy ? (
                      <>
                        <span className="messageForm__spinner" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="messageForm__submitIcon">{SendIcon}</span>
                        Send Message
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="messageForm__clear"
                    onClick={() => {
                      setName("");
                      setEmail("");
                      setMessage("");
                      setError(null);
                      setSent(false);
                    }}
                    disabled={busy}
                  >
                    <span>{ClearIcon}</span>
                    Clear
                  </button>
                </div>
              </form>

              {/* Tip */}
              <div className="messageForm__tip">
                <span className="messageForm__tipIcon">{TipIcon}</span>
                <span>Tip: The more specific you are, the easier it is for us to help.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DonationPopup />
      <Footer />
      <style>{css}</style>
    </div>
  );
}

/* ============ SVG Icons as Components ============ */
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4 2.1h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function OrgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h18" />
    </svg>
  );
}

const InfoIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const MessageIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CopyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CallIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4 2.1h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

const SendMailIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const LockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SuccessIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="16 10 10 16 8 14" />
  </svg>
);

const ErrorIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const UserIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PenIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const SendIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ClearIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const TipIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6M12 2v1M12 22v-1M4.2 4.2l.7.7M19.8 4.2l-.7.7M2 12h1M22 12h-1M4.9 19.1l.7-.7M19.1 19.1l-.7-.7" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

/* ============ Styles ============ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.contactPage {
  --navy-950: #0a0f1a;
  --navy-900: #0d1526;
  --navy-800: #132037;
  --navy-700: #1a2d4d;
  --navy-600: #234168;
  --accent-blue: #3b82f6;
  --accent-teal: #14b8a6;
  --accent-emerald: #10b981;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --glass-bg: rgba(13, 21, 38, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --success: #22c55e;
  --error: #ef4444;

  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--navy-950) 0%, var(--navy-900) 50%, var(--navy-800) 100%);
  color: var(--text-primary);
  position: relative;
  overflow-x: hidden;
}

.contactPage__glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  transition: background 0.3s ease;
}

.contactPage__main {
  flex: 1;
  width: min(1100px, 94vw);
  margin: 0 auto;
  padding: 24px 0 60px;
  position: relative;
  z-index: 1;
}

/* ============ Hero Section ============ */
.contactHero {
  position: relative;
  padding: 40px 0 32px;
  text-align: center;
  overflow: hidden;
}

.contactHero__content {
  position: relative;
  z-index: 2;
}

.contactHero__badge {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--navy-700), var(--navy-600));
  border: 2px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 0 40px rgba(59, 130, 246, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.3);
  animation: badgePulse 3s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(59, 130, 246, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 60px rgba(59, 130, 246, 0.25), 0 12px 40px rgba(0, 0, 0, 0.4); }
}

.contactHero__logo {
  width: 70px;
  height: 70px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.contactHero__title {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

.contactHero__titleLine {
  display: block;
}

.contactHero__titleLine--accent {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.contactHero__subtitle {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--text-secondary);
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Decorative elements */
.contactHero__decor {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
  pointer-events: none;
}

.contactHero__decor--1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.contactHero__decor--2 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%);
  bottom: -50px;
  left: -50px;
  animation: float 8s ease-in-out infinite reverse;
}

.contactHero__decor--3 {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
  top: 50%;
  left: 10%;
  animation: float 7s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

/* ============ Tabs ============ */
.contactTabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 32px;
  padding: 6px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  width: fit-content;
  position: relative;
  backdrop-filter: blur(12px);
}

.contactTabs__btn {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.contactTabs__btn:hover:not(.contactTabs__btn--active) {
  color: var(--text-primary);
}

.contactTabs__btn--active {
  color: var(--text-primary);
}

.contactTabs__icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contactTabs__icon svg {
  width: 100%;
  height: 100%;
}

.contactTabs__indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc(50% - 6px);
  height: calc(100% - 12px);
  background: linear-gradient(135deg, var(--navy-600), var(--navy-700));
  border-radius: 10px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* ============ Content Panels ============ */
.contactContent {
  position: relative;
  min-height: 500px;
}

.contactPanel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.contactPanel--active {
  position: relative;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* ============ Contact Info Panel ============ */
.contactInfo {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(12px);
}

.contactInfo__header {
  text-align: center;
  margin-bottom: 32px;
}

.contactInfo__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.contactInfo__desc {
  color: var(--text-secondary);
  margin: 0;
  font-size: 15px;
}

.contactList {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contactItem {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(26, 45, 77, 0.4);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  transition: all 0.3s ease;
  animation: slideInUp 0.5s ease both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.contactItem:hover {
  background: rgba(35, 65, 104, 0.5);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.contactItem__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-teal));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contactItem__icon svg {
  width: 22px;
  height: 22px;
  color: white;
}

.contactItem__content {
  flex: 1;
  min-width: 0;
}

.contactItem__label {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.contactItem__value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.contactItem__actions {
  display: flex;
  gap: 8px;
}

.contactItem__btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  text-decoration: none;
}

.contactItem__btn svg {
  width: 16px;
  height: 16px;
}

.contactItem__btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  transform: scale(1.05);
}

.contactItem__btn--copied {
  background: rgba(34, 197, 94, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.3) !important;
  color: var(--success) !important;
}

.contactItem__tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  padding: 4px 8px;
  background: var(--navy-700);
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
}

.contactItem__btn:hover .contactItem__tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

/* Quick Actions */
.contactQuick {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.contactQuick__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.contactQuick__btn--call {
  background: linear-gradient(135deg, var(--accent-emerald), #059669);
  color: white;
}

.contactQuick__btn--email {
  background: linear-gradient(135deg, var(--accent-blue), #2563eb);
  color: white;
}

.contactQuick__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.contactQuick__icon {
  width: 20px;
  height: 20px;
  display: flex;
}

.contactQuick__icon svg {
  width: 100%;
  height: 100%;
}

/* ============ Message Form Panel ============ */
.messageForm {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(12px);
}

.messageForm__header {
  text-align: center;
  margin-bottom: 24px;
}

.messageForm__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.messageForm__desc {
  color: var(--text-secondary);
  margin: 0;
  font-size: 15px;
}

.messageForm__privacy {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 14px;
  margin-bottom: 24px;
}

.messageForm__privacyIcon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: var(--accent-blue);
}

.messageForm__privacyIcon svg {
  width: 100%;
  height: 100%;
}

.messageForm__privacy strong {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.messageForm__privacy p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Alerts */
.contactAlert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 20px;
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.contactAlert--success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.contactAlert--success .contactAlert__icon {
  color: var(--success);
}

.contactAlert--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.contactAlert--error .contactAlert__icon {
  color: var(--error);
}

.contactAlert__icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.contactAlert__icon svg {
  width: 100%;
  height: 100%;
}

.contactAlert strong {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

.contactAlert p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* Form */
.messageForm__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.messageForm__hp {
  position: absolute !important;
  left: -9999px !important;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.messageForm__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .messageForm__row {
    grid-template-columns: 1fr 1fr;
  }
}

.messageForm__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.messageForm__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.messageForm__labelIcon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.messageForm__labelIcon svg {
  width: 100%;
  height: 100%;
}

.messageForm__optional {
  font-weight: 400;
  color: var(--text-muted);
}

.messageForm__required {
  color: var(--accent-teal);
  font-weight: 700;
}

.messageForm__input,
.messageForm__textarea {
  width: 100%;
  padding: 14px 16px;
  background: rgba(10, 15, 26, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 15px;
  transition: all 0.3s ease;
  outline: none;
}

.messageForm__input::placeholder,
.messageForm__textarea::placeholder {
  color: var(--text-muted);
}

.messageForm__input:focus,
.messageForm__textarea:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background: rgba(10, 15, 26, 0.8);
}

.messageForm__textarea {
  min-height: 140px;
  resize: vertical;
}

.messageForm__counter {
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.messageForm__counter--warn {
  color: #f59e0b;
  font-weight: 600;
}

/* Actions */
.messageForm__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

@media (min-width: 480px) {
  .messageForm__actions {
    flex-direction: row;
  }
}

.messageForm__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--accent-blue), #2563eb);
  border: none;
  border-radius: 12px;
  color: white;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.messageForm__submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.messageForm__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.messageForm__submitIcon {
  width: 18px;
  height: 18px;
}

.messageForm__submitIcon svg {
  width: 100%;
  height: 100%;
}

.messageForm__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.messageForm__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.messageForm__clear:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.messageForm__clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.messageForm__clear svg {
  width: 16px;
  height: 16px;
}

/* Tip */
.messageForm__tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.messageForm__tipIcon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #f59e0b;
}

.messageForm__tipIcon svg {
  width: 100%;
  height: 100%;
}

/* ============ Responsive ============ */
@media (max-width: 640px) {
  .contactHero {
    padding: 24px 0;
  }
  
  .contactHero__badge {
    width: 80px;
    height: 80px;
  }
  
  .contactHero__logo {
    width: 55px;
    height: 55px;
  }
  
  .contactTabs__btn {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .contactInfo,
  .messageForm {
    padding: 20px;
    border-radius: 20px;
  }
  
  .contactItem {
    flex-wrap: wrap;
    padding: 14px 16px;
  }
  
  .contactItem__content {
    flex: 1 1 auto;
    min-width: 150px;
  }
  
  .contactItem__actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--glass-border);
  }
  
  .contactQuick {
    grid-template-columns: 1fr;
  }
}
`;