// src/pages/WhatsAppGuidelines.tsx
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function WhatsAppGuidelines() {
  return (
    <div className="wag">
      <Navbar />

      <main className="wag__wrap">
        {/* Topplinje: tittel-pill til venstre, tilbake-knapp til høyre */}
        <div className="wag__bar">
          <div className="wag__title">WhatsApp Guidelines</div>
          <Link to="/about" className="wag__back">Return to About us</Link>
        </div>

        {/* Panel med retningslinjer */}
        <section className="wag__panel">
          <div className="wag__panelInner">
            <p className="wag__center wag__heading">WhatsApp Guidelines</p>
            <p className="wag__center">
              Dear honorable members , let’s not forget the rules and regulations concerning this WhatsApp
              platform. It won’t be nice to start blocking people who will not follow the rules.
            </p>
            <p className="wag__center">HERE ARE THE DETAILS</p>
            <p className="wag__center">
              Liberia Union Oslo / Viken Norway WhatsApp Group Rules and Guidelines
            </p>
            <ol className="wag__list">
              <li>
                Liberia Union is a voluntary, non-political, non-religious and non-tribal organisation.
              </li>
              <li>
                We have created this group for the Liberian community in Norway and its related activities.
                Irrelevant contents do not belong to this platform.
              </li>
              <li>
                Please, do not discuss any religious, political and tribal matters on this platform unless
                otherwise authorised by Liberia Union Norway.
              </li>
              <li>Do not share irrelevant forwarded audio, videos, photos and messages.</li>
              <li>
                Do not advertise any business or event on this group without approval from the board of
                Liberia Union.
              </li>
              <li>
                Mutual respect is required during discussions. Respect other viewpoints even if not aligned
                with ones views.
              </li>
              <li>
                Offensive language, posts that promote violence, sexually explicit contents and other adult
                materials like pornography are not allowed on this platform.
              </li>
              <li>
                Postings on this platform are restricted to matters that directly affect us as a community.
              </li>
              <li>Do not post messages after 11pm during weekdays (Monday to Friday).</li>
              <li>
                We will take the following actions on offending incidents:
                <br />(1) First time offenders will be warned.
                <br />(11) Subsequent offenders will be permanently removed from the platform.
              </li>
            </ol>
            <p className="wag__center">
              These ten (10) simple guidelines will, hopefully, keep this group functioning like a
              well-oiled machine. It is crucial for all of us to follow these rules and make the Ghana Union
              Norway Group a better, focused and organised platform for the upliftment of our community.
            </p>
            <p className="wag__center">Sincerely<br />Liberia Union Oslo / Viken Norway</p>
          </div>
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

/* ----------------------------- STIL (match referansen) ----------------------------- */
const css = `
:root{
  --navy:#1f2f58;     /* mørk blå for pill/knapper */
  --navy-border:#0e1a33;
  --panel-border:#0f1e3a;
}

/* layout */
.wag{display:flex;flex-direction:column;min-height:100vh;background:#fff}
.wag__wrap{flex:1;width:min(1100px,92vw);margin:0 auto;padding:26px 0 56px}

/* topplinjen */
.wag__bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.wag__title{
  display:inline-block;
  background:var(--navy);
  color:#fff;
  border:2px solid var(--navy-border);
  border-radius:10px;
  padding:10px 18px;
  font-weight:900;
  font-size:22px;
  letter-spacing:.2px;
  box-shadow:0 3px 8px rgba(15,26,46,.18);
}
.wag__back{
  display:inline-block;
  background:var(--navy);
  color:#fff;
  border:1px solid var(--navy-border);
  border-radius:8px;
  padding:8px 12px;
  text-decoration:none;
  font-weight:600;
}
.wag__back:hover{opacity:.95}

/* panelet */
.wag__panel{
  border-radius:10px;
  background:#ffffff;
  border:2px solid var(--panel-border);
  padding:10px;
  box-shadow:0 4px 10px rgba(0,0,0,.08);
}
.wag__panelInner{
  border-radius:6px;
  background:#fff;
  min-height:280px;
  padding:18px 22px;
  color:#1b2238;
  line-height:1.5;
  font-size:14px; /* liten, som i referansebildet */
}
.wag__center{text-align:center}
.wag__heading{font-weight:700;margin-bottom:6px}

.wag__list{
  margin:10px 18px 10px 28px;
  padding:0;
}
.wag__list li{margin:6px 0}
`;
