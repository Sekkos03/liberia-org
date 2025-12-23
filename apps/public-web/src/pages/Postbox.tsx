import { type FormEvent, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { submitSuggestion } from "../lib/postbox";

const MAX_MSG = 2000;

export default function Postbox() {
  // Skjemastate
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // UI-state
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Honeypot (anti-spam) – skal forbli tom
  const hpRef = useRef<HTMLInputElement>(null);

  const left = useMemo(() => Math.max(0, MAX_MSG - message.length), [message.length]);

  function validate(): string | null {
    if (!message.trim()) return "Message cannot be empty.";
    if (message.length > MAX_MSG) return `Message is too long (max ${MAX_MSG} characters).`;
    if (email.trim()) {
      // enkel epost-sjekk
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
      if (!ok) return "Ugyldig e-postadresse.";
    }
    if (hpRef.current?.value) {
      // Skjult felt fylt ut → sannsynlig bot
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
            <h1 id="pbTitle" className="pbHero__title">Postbox</h1>
            <p className="pbHero__tag">Do you have a suggestion? Let us know anonymously if you want.</p>
          </div>
        </section>

        {/* INNHOLD */}
        <section className="pbGrid">
          {/* Info */}
          <aside className="pbInfo" aria-label="Om postboxen">
            <h2 className="pbInfo__title">How it works</h2>
            <ul className="pbInfo__list">
              <li>Suggestions can be submitted with or without your name and email.</li>
              <li>We read everything and follow up on input that requires action.</li>
              <li>Want a response? Include your email – otherwise you remain anonymous.</li>
            </ul>

            <h3 className="pbInfo__subtitle">Privacy</h3>
            <p className="pbInfo__text">
              We store your message securely and share it only internally when necessary.
              Read more in our guidelines or get in touch if you have questions.
            </p>

            <div className="pbInfo__hint">
              Tip: The more specific you are, the easier it is for us to follow up.
            </div>
          </aside>

          {/* Skjema */}
          <div className="pbFormCard">
            {sent && (
              <div className="pbAlert pbAlert--ok" role="status" aria-live="polite">
                <span className="pbAlert__title">Thank you!</span> Your message has been sent!. 💌
              </div>
            )}
            {error && (
              <div className="pbAlert pbAlert--err" role="alert" aria-live="assertive">
                {error}
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
                placeholder="Ikke fyll ut"
              />

              <div className="pbRow">
                <label className="pbField">
                  <span className="pbLabel">Name (optional)</span>
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
                  <span className="pbLabel">Email (optional)</span>
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
                  <span className={left < 100 ? "warn" : ""}>{left} characters remaining</span>
                </div>
              </label>

              <div className="pbActions">
                <button type="submit" className="pbBtn pbBtn--primary" disabled={busy}>
                  {busy ? "Sending…" : "Send message"}
                </button>
                <button
                  type="button"
                  className="pbBtn"
                  onClick={() => {
                    setName(""); setEmail(""); setMessage(""); setError(null); setSent(false);
                  }}
                  disabled={busy}
                >
                  Clear
                </button>
              </div>
            </form>

            <p className="pbFootnote">
              We save your message and review it as soon as possible. Personal information is
              optional—add it if you want a response.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

/* --------------------------------- STIL --------------------------------- */
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

/* layout */
.postbox{display:flex;flex-direction:column;min-height:100vh;background:#fff;}
.postbox__wrap{flex:1;width:min(1080px,94vw);margin:0 auto;padding:28px 0 56px}

/* hero */
.pbHero{margin:8px 0 24px;display:grid;place-items:center}
.pbHero__banner{
  width:100%;
  min-height:120px;
  background:linear-gradient(180deg,#1a2d52,#16254a);
  color:#e6eefc;
  border-radius:16px;
  border:1px solid #0e1f3b;
  box-shadow:0 6px 18px rgba(12,18,32,.2);
  display:grid;place-items:center;padding:18px
}
.pbHero__title{font-size:34px;font-weight:900;letter-spacing:.3px;margin:0}
.pbHero__tag{opacity:.9;margin-top:6px}

/* grid */
.pbGrid{display:grid;grid-template-columns:1fr 1.2fr;gap:22px;margin-top:8px}
@media (max-width: 940px){ .pbGrid{grid-template-columns:1fr;gap:16px} }

/* info */
.pbInfo{
  background:#0f2139;
  border:1px solid #223a58;
  color:#e7eef9;
  border-radius:16px;
  padding:18px;
  box-shadow:0 6px 18px rgba(13,26,46,.12)
}
.pbInfo__title{font-size:20px;font-weight:800;margin:0 0 8px}
.pbInfo__subtitle{font-size:16px;font-weight:700;margin:12px 0 4px}
.pbInfo__list{margin:0 0 10px 18px;color:#dbe7fb}
.pbInfo__list li{margin:4px 0}
.pbInfo__text{color:#cfe0fa;margin:0 0 10px}
.pbInfo__hint{
  background:#132a49;border:1px solid #244368;color:#cfe0fa;
  padding:8px 10px;border-radius:10px;font-weight:600
}

/* form card */
.pbFormCard{
  background:#0f2139;
  border:1px solid #223a58;
  color:#e7eef9;
  border-radius:16px;
  padding:18px;
  box-shadow:0 6px 18px rgba(13,26,46,.12)
}
.pbRow{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width: 720px){ .pbRow{grid-template-columns:1fr} }

.pbField{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.pbLabel{font-size:14px;opacity:.9}
.pbReq{color:#ffdf7d}

.pbInput,.pbTextarea{
  background:#0b1a2d;
  border:1px solid #2a4668;
  color:#e6eefc;
  border-radius:10px;
  padding:10px 12px;
  outline:0;
}
.pbInput:focus,.pbTextarea:focus{border-color:#3a6aa2;box-shadow:0 0 0 3px rgba(58,106,162,.25)}
.pbTextarea{min-height:170px;resize:vertical}

.pbHelp{display:flex;justify-content:flex-end;font-size:12px;color:#bcd0ea}
.pbHelp .warn{color:#ffb454}

.pbActions{display:flex;gap:10px;margin-top:6px}
.pbBtn{
  background:transparent;color:#e7eef9;border:1px solid #2a4668;
  padding:10px 14px;border-radius:10px;cursor:pointer
}
.pbBtn:hover{background:#0b1a2d}
.pbBtn[disabled]{opacity:.6;cursor:not-allowed}
.pbBtn--primary{background:#1a345a;border-color:#2f5585}
.pbBtn--primary:hover{background:#224270}

.pbFootnote{margin-top:14px;font-size:13px;color:#bcd0ea}

/* alerts */
.pbAlert{border-radius:12px;padding:10px 12px;margin-bottom:10px;font-weight:600}
.pbAlert--ok{background:#093d24;border:1px solid #1d8a4d;color:#b9f7d1}
.pbAlert--err{background:#4a1414;border:1px solid #b25656;color:#ffe0e0}

/* honeypot */
.pbHP{position:absolute !important;left:-9999px !important;width:1px;height:1px;opacity:0}
`;
