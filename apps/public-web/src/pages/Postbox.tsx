import { type FormEvent, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { submitSuggestion } from "../lib/postbox";
import DonationPopup from "../components/Donationpopup";

const MAX_MSG = 2000;

export default function Postbox() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hpRef = useRef<HTMLInputElement>(null);

  const left = useMemo(() => Math.max(0, MAX_MSG - message.length), [message.length]);

  function validate(): string | null {
    if (!message.trim()) return "Message cannot be empty.";
    if (message.length > MAX_MSG) return `Message is too long (max ${MAX_MSG} characters).`;
    if (email.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
      if (!ok) return "Invalid email address.";
    }
    if (hpRef.current?.value) {
      return "Could not send the message.";
    }
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
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="postbox">
      <Navbar />

      <main className="postbox__wrap">
        {/* HERO */}
        <section className="pbHero" aria-labelledby="pbTitle">
          <div className="pbHero__banner">
            <div className="pbHero__icon">💬</div>
            <h1 id="pbTitle" className="pbHero__title">Postbox</h1>
            <p className="pbHero__tag">Do you have a suggestion? Let us know anonymously if you want.</p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="pbGrid">
          {/* Info */}
          <aside className="pbInfo" aria-label="About the postbox">
            <h2 className="pbInfo__title">
              <span className="pbInfo__titleIcon">ℹ️</span>
              How it works
            </h2>
            <ul className="pbInfo__list">
              <li>Suggestions can be submitted with or without your name and email.</li>
              <li>We read everything and follow up on input that requires action.</li>
              <li>Want a response? Include your email — otherwise you remain anonymous.</li>
            </ul>

            <h3 className="pbInfo__subtitle">
              <span className="pbInfo__subtitleIcon">🔒</span>
              Privacy
            </h3>
            <p className="pbInfo__text">
              We store your message securely and share it only internally when necessary.
              Read more in our guidelines or get in touch if you have questions.
            </p>

            <div className="pbInfo__hint">
              <span className="hintIcon">💡</span>
              <span>Tip: The more specific you are, the easier it is for us to follow up.</span>
            </div>
          </aside>

          {/* Form */}
          <div className="pbFormCard">
            {sent && (
              <div className="pbAlert pbAlert--ok" role="status" aria-live="polite">
                <span className="pbAlert__icon">✅</span>
                <div>
                  <span className="pbAlert__title">Thank you!</span>
                  <span className="pbAlert__text">Your message has been sent! 💌</span>
                </div>
              </div>
            )}
            {error && (
              <div className="pbAlert pbAlert--err" role="alert" aria-live="assertive">
                <span className="pbAlert__icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate>
              {/* Honeypot */}
              <input
                ref={hpRef}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="pbHP"
                aria-hidden="true"
                placeholder="Don't fill this out"
              />

              <div className="pbRow">
                <label className="pbField">
                  <span className="pbLabel">
                    <span className="pbLabel__icon">👤</span>
                    Name (optional)
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="pbInput"
                    autoComplete="name"
                    maxLength={140}
                  />
                </label>

                <label className="pbField">
                  <span className="pbLabel">
                    <span className="pbLabel__icon">📧</span>
                    Email (optional)
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="your@email.com"
                    className="pbInput"
                    autoComplete="email"
                    maxLength={140}
                  />
                </label>
              </div>

              <label className="pbField">
                <span className="pbLabel">
                  <span className="pbLabel__icon">✍️</span>
                  Message <span className="pbReq">*</span>
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="pbTextarea"
                  placeholder="Write your message here…"
                  required
                  maxLength={MAX_MSG}
                />
                <div className="pbHelp">
                  <span className={left < 100 ? "warn" : ""}>
                    {left} character{left !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              </label>

              <div className="pbActions">
                <button type="submit" className="pbBtn pbBtn--primary" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="spinner" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      Send message
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="pbBtn pbBtn--secondary"
                  onClick={() => {
                    setName("");
                    setEmail("");
                    setMessage("");
                    setError(null);
                    setSent(false);
                  }}
                  disabled={busy}
                >
                  <span>🗑️</span>
                  Clear
                </button>
              </div>
            </form>

            <p className="pbFootnote">
              <span className="footnoteIcon">🔐</span>
              We save your message and review it as soon as possible. Personal information is
              optional—add it if you want a response.
            </p>
          </div>
        </section>
      </main>
      <DonationPopup />
      <Footer />
      <style>{css}</style>
    </div>
  );
}

const css = `
:root{
  --ink:#0b1020;
  --navy-900:#0f1d37;
  --navy-800:#15284b;
  --navy-700:#1b3a6a;
  --paper:#fff;
  --muted:#9fb2cc;
  --teal:#29a3a3;
  --ok:#16a34a;
  --err:#b91c1c;
}

.postbox{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,0.08), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,0.1), transparent 60%),
    #fff;
}

.postbox__wrap{
  flex:1;
  width:min(1080px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
}

@media (min-width: 640px) {
  .postbox__wrap{padding:28px 0 56px;}
}

.pbHero{
  margin:8px 0 20px;
  display:grid;
  place-items:center;
  animation:fadeInDown 0.6s ease;
}

@media (min-width: 640px) {
  .pbHero{margin:8px 0 24px;}
}

@keyframes fadeInDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.pbHero__banner{
  width:100%;
  min-height:140px;
  background:linear-gradient(135deg, #1a2d52 0%, #16254a 100%);
  color:#e6eefc;
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.1);
  box-shadow:0 10px 30px rgba(12,18,32,0.2);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:16px;
  text-align:center;
}

@media (min-width: 640px) {
  .pbHero__banner{
    min-height:160px;
    border-radius:16px;
    padding:20px;
  }
}

.pbHero__icon{
  font-size:36px;
  margin-bottom:8px;
  animation:bounce 2s ease infinite;
}

@media (min-width: 640px) {
  .pbHero__icon{
    font-size:48px;
    margin-bottom:12px;
  }
}

@keyframes bounce{
  0%, 100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}
}

.pbHero__title{
  font-size:24px;
  font-weight:900;
  letter-spacing:0.3px;
  margin:0;
}

@media (min-width: 640px) {
  .pbHero__title{font-size:34px;}
}

.pbHero__tag{
  opacity:0.9;
  margin-top:6px;
  font-size:13px;
  max-width:90%;
}

@media (min-width: 640px) {
  .pbHero__tag{
    font-size:15px;
    margin-top:8px;
  }
}

.pbGrid{
  display:grid;
  grid-template-columns:1fr;
  gap:16px;
  margin-top:8px;
}

@media (min-width: 940px) {
  .pbGrid{
    grid-template-columns:1fr 1.2fr;
    gap:22px;
  }
}

.pbInfo{
  background:linear-gradient(135deg, #0f2139 0%, #1e3a5f 100%);
  border:1px solid rgba(255,255,255,0.1);
  color:#e7eef9;
  border-radius:12px;
  padding:16px;
  box-shadow:0 6px 18px rgba(13,26,46,0.12);
  animation:slideUp 0.5s ease;
  animation-delay:0.1s;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .pbInfo{
    border-radius:16px;
    padding:18px;
  }
}

@keyframes slideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

.pbInfo__title{
  font-size:18px;
  font-weight:800;
  margin:0 0 12px;
  display:flex;
  align-items:center;
  gap:8px;
}

@media (min-width: 640px) {
  .pbInfo__title{
    font-size:20px;
    margin:0 0 14px;
  }
}

.pbInfo__titleIcon{
  font-size:20px;
}

@media (min-width: 640px) {
  .pbInfo__titleIcon{font-size:22px;}
}

.pbInfo__subtitle{
  font-size:15px;
  font-weight:700;
  margin:16px 0 8px;
  display:flex;
  align-items:center;
  gap:6px;
}

@media (min-width: 640px) {
  .pbInfo__subtitle{
    font-size:16px;
    margin:18px 0 10px;
  }
}

.pbInfo__subtitleIcon{
  font-size:16px;
}

.pbInfo__list{
  margin:0 0 10px 20px;
  color:#dbe7fb;
  padding:0;
}

@media (min-width: 640px) {
  .pbInfo__list{margin:0 0 12px 24px;}
}

.pbInfo__list li{
  margin:6px 0;
  font-size:13px;
  line-height:1.5;
}

@media (min-width: 640px) {
  .pbInfo__list li{
    margin:8px 0;
    font-size:14px;
  }
}

.pbInfo__text{
  color:#cfe0fa;
  margin:0 0 12px;
  font-size:13px;
  line-height:1.5;
}

@media (min-width: 640px) {
  .pbInfo__text{
    font-size:14px;
    margin:0 0 14px;
  }
}

.pbInfo__hint{
  background:rgba(19,42,73,0.6);
  border:1px solid rgba(36,67,104,0.8);
  color:#cfe0fa;
  padding:10px 12px;
  border-radius:10px;
  font-weight:600;
  font-size:12px;
  display:flex;
  align-items:center;
  gap:8px;
}

@media (min-width: 640px) {
  .pbInfo__hint{
    padding:12px 14px;
    font-size:13px;
  }
}

.hintIcon{
  font-size:18px;
  flex-shrink:0;
}

@media (min-width: 640px) {
  .hintIcon{font-size:20px;}
}

.pbFormCard{
  background:linear-gradient(135deg, #0f2139 0%, #1e3a5f 100%);
  border:1px solid rgba(255,255,255,0.1);
  color:#e7eef9;
  border-radius:12px;
  padding:16px;
  box-shadow:0 6px 18px rgba(13,26,46,0.12);
  animation:slideUp 0.5s ease;
  animation-delay:0.2s;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .pbFormCard{
    border-radius:16px;
    padding:20px;
  }
}

.pbRow{
  display:grid;
  grid-template-columns:1fr;
  gap:12px;
}

@media (min-width: 640px) {
  .pbRow{grid-template-columns:1fr 1fr;}
}

.pbField{
  display:flex;
  flex-direction:column;
  gap:6px;
  margin-bottom:14px;
}

@media (min-width: 640px) {
  .pbField{
    gap:8px;
    margin-bottom:16px;
  }
}

.pbLabel{
  font-size:13px;
  opacity:0.9;
  font-weight:600;
  display:flex;
  align-items:center;
  gap:6px;
}

@media (min-width: 640px) {
  .pbLabel{font-size:14px;}
}

.pbLabel__icon{
  font-size:14px;
}

@media (min-width: 640px) {
  .pbLabel__icon{font-size:16px;}
}

.pbReq{
  color:#ffdf7d;
  font-weight:700;
}

.pbInput,
.pbTextarea{
  background:rgba(11,26,45,0.6);
  border:1px solid rgba(42,70,104,0.8);
  color:#e6eefc;
  border-radius:8px;
  padding:10px 12px;
  outline:0;
  font-size:14px;
  transition:all 0.3s ease;
  font-family:inherit;
}

@media (min-width: 640px) {
  .pbInput,
  .pbTextarea{
    border-radius:10px;
    padding:12px 14px;
    font-size:15px;
  }
}

.pbInput:focus,
.pbTextarea:focus{
  border-color:#3a6aa2;
  box-shadow:0 0 0 3px rgba(58,106,162,0.25);
  background:rgba(11,26,45,0.8);
}

.pbTextarea{
  min-height:140px;
  resize:vertical;
}

@media (min-width: 640px) {
  .pbTextarea{min-height:170px;}
}

.pbHelp{
  display:flex;
  justify-content:flex-end;
  font-size:11px;
  color:#bcd0ea;
  margin-top:4px;
}

@media (min-width: 640px) {
  .pbHelp{
    font-size:12px;
    margin-top:6px;
  }
}

.pbHelp .warn{
  color:#ffb454;
  font-weight:600;
}

.pbActions{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-top:6px;
}

@media (min-width: 640px) {
  .pbActions{
    flex-direction:row;
    gap:12px;
    margin-top:8px;
  }
}

.pbBtn{
  background:transparent;
  color:#e7eef9;
  border:1px solid rgba(42,70,104,0.8);
  padding:12px 16px;
  border-radius:10px;
  cursor:pointer;
  font-size:14px;
  font-weight:600;
  transition:all 0.3s ease;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  font-family:inherit;
}

@media (min-width: 640px) {
  .pbBtn{
    padding:12px 18px;
    font-size:15px;
  }
}

.pbBtn:hover:not([disabled]){
  background:rgba(11,26,45,0.6);
  transform:translateY(-2px);
  box-shadow:0 4px 12px rgba(0,0,0,0.2);
}

.pbBtn:active:not([disabled]){
  transform:translateY(0);
}

.pbBtn[disabled]{
  opacity:0.6;
  cursor:not-allowed;
}

.pbBtn--primary{
  background:linear-gradient(135deg, #1a345a 0%, #2f5585 100%);
  border-color:rgba(47,85,133,0.8);
}

.pbBtn--primary:hover:not([disabled]){
  background:linear-gradient(135deg, #224270 0%, #3a6aa2 100%);
}

.pbBtn--secondary{
  background:rgba(26,52,90,0.4);
}

.spinner{
  width:14px;
  height:14px;
  border:2px solid rgba(255,255,255,0.3);
  border-top-color:#fff;
  border-radius:50%;
  animation:spin 0.8s linear infinite;
}

@keyframes spin{
  to{transform:rotate(360deg)}
}

.pbFootnote{
  margin-top:16px;
  font-size:12px;
  color:#bcd0ea;
  display:flex;
  align-items:flex-start;
  gap:8px;
  line-height:1.5;
  opacity:0.9;
}

@media (min-width: 640px) {
  .pbFootnote{
    margin-top:18px;
    font-size:13px;
  }
}

.footnoteIcon{
  font-size:14px;
  flex-shrink:0;
  margin-top:2px;
}

@media (min-width: 640px) {
  .footnoteIcon{font-size:16px;}
}

.pbAlert{
  border-radius:10px;
  padding:12px 14px;
  margin-bottom:16px;
  font-weight:600;
  display:flex;
  align-items:center;
  gap:10px;
  font-size:13px;
  animation:slideDown 0.4s ease;
}

@media (min-width: 640px) {
  .pbAlert{
    border-radius:12px;
    padding:14px 16px;
    margin-bottom:18px;
    font-size:14px;
    gap:12px;
  }
}

@keyframes slideDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.pbAlert__icon{
  font-size:20px;
  flex-shrink:0;
}

@media (min-width: 640px) {
  .pbAlert__icon{font-size:24px;}
}

.pbAlert__title{
  font-weight:800;
  display:block;
  margin-bottom:4px;
}

.pbAlert__text{
  display:block;
  opacity:0.9;
}

.pbAlert--ok{
  background:rgba(9,61,36,0.8);
  border:1px solid rgba(29,138,77,0.8);
  color:#b9f7d1;
}

.pbAlert--err{
  background:rgba(74,20,20,0.8);
  border:1px solid rgba(178,86,86,0.8);
  color:#ffe0e0;
}

.pbHP{
  position:absolute !important;
  left:-9999px !important;
  width:1px;
  height:1px;
  opacity:0;
}
`;