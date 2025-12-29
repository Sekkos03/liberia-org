import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import liberianHeadlines from "../assets/Liberian Headlines.png";

type Executive = {
  id: string | number;
  name: string;
  title?: string;
  photoUrl?: string; // valgfri – hvis du får bilder senere
};

const executives: Executive[] = [
  { id: 1, name: "EXE 1" },
  { id: 2, name: "EXE 2" },
  { id: 3, name: "EXE 3" },
  { id: 4, name: "EXE 4" },
  { id: 5, name: "EXE 5" },
  { id: 6, name: "EXE 6" },
  { id: 7, name: "EXE 7" },
];

export default function AboutUs() {
  return (
    <div className="about">
      <Navbar />
      <main className="about__wrap">
        {/* HERO */}
        <section className="aboutHero" aria-label="Intro">
         <div className="aboutHero__banner">
            <img
              src={liberianHeadlines}
              alt="Liberian headlines"
              className="heroBanner__img"
            />
          </div>

          <div className="aboutHero__title">About us</div>


          <div className="aboutHero__actions">
            <Link to="/about/constitution" className="aboutBtn">CONSTITUTION</Link>
            <Link to="/about/whatsapp-guidelines" className="aboutBtn">WhatsApp Guidelines</Link>
          </div>
        </section>

        {/* TEKSTBLOKK */}
        <section className="aboutText">
          <p>
            ULAN is a non governmental organization basing in Norway that carries out charitable socioeconomic developments in Liberia through five thematic areas; 
            Health, Education, Agriculture, Microfinance, and Emergency Relief in Liberia ( commonly known as the HEAMER PROJECTS). 
            The nonprofit charitable organization, which is run by Liberians residing in the Kingdom of norway and Liberia respectively was established in 2005 in the Norwegian city of Kongsberg.
          </p>
        </section>

        {/* EXECUTIVES */}
        <h2 className="execs__title">THE EXECUTIVES</h2>
        <section className="execs">
          {executives.map((x) => (
            <div key={x.id} className="execs__card">
              {x.photoUrl ? (
                <img src={x.photoUrl} className="execs__avatar" alt={x.name} />
              ) : (
                <div className="execs__avatar execs__avatar--placeholder" aria-hidden="true" />
              )}
              <div className="execs__name">{x.name}</div>
              {x.title && <div className="execs__role">{x.title}</div>}
            </div>
          ))}
        </section>
      </main>
      <Footer />
      <style>{css}</style>
    </div>
  );
}

/* ------------------------------- STIL ------------------------------- */
const css = `
:root{
  --navy-900:#0f1d37;
  --navy-800:#15284b;
  --navy-700:#1e3a66;
  --ink:#0b1020;
  --paper:#ffffff;
}

/* layout */
.about{display:flex;flex-direction:column;min-height:100vh;background:#fff;}
.about__wrap{flex:1;width:min(1100px,94vw);margin:0 auto;padding:24px 0 56px}

/* hero */
.aboutHero{position:relative;margin:12px 0 24px}
.aboutHero__banner{
  background:#1e2f53;
  border:2px solid #0e1f3b;
  border-radius:14px;
  min-height:140px;
  display:grid;place-items:center;
  color:#cfe0fa;
  box-shadow:0 6px 18px rgba(12,18,32,.2);
  overflow: hidden;
  height: 240px;

}
  .heroBanner__img{
  width:100%;
  height:100%;
  object-fit:contain;
  background:#fff;
  display:block;
}

.aboutHero__placeholder{opacity:.9}
.aboutHero__title{
  position:relative;
  width:min(620px,92%);
  margin:-32px auto 0;
  background:#fff;
  border:2px solid #0e1f3b;
  border-radius:10px;
  padding:18px 24px;
  text-align:center;
  font-weight:800;
  font-size:24px;
  box-shadow:0 6px 18px rgba(12,18,32,.18);
}
.aboutHero__actions{
  margin-top:14px;
  display:flex;
  justify-content:space-between;
}
.aboutBtn{
  background:#192c51;
  color:#e6eefc;
  border:1px solid #0f1f3c;
  border-radius:8px;
  padding:8px 12px;
  font-weight:700;
  text-decoration:none;
}
.aboutBtn:hover{opacity:.95}

/* tekstblokk */
.aboutText{
  margin:20px 0 26px;
  background:#122648;
  color:#e7eef9;
  border:1px solid #223a58;
  border-radius:12px;
  padding:16px 18px;
  box-shadow:0 6px 18px rgba(13,26,46,.12)
}

/* executives */
.execs__title{
  text-align:center;
  font-weight:800;
  letter-spacing:.6px;
  margin:10px 0 12px;
}
.execs{
  border:2px solid #0e1f3b;
  border-radius:10px;
  padding:14px 16px 18px;
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:22px 26px;
}
@media (max-width: 960px){ .execs{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (max-width: 700px){ .execs{ grid-template-columns:repeat(2,minmax(0,1fr)); } }

.execs__card{display:grid;justify-items:center;text-align:center}
.execs__avatar{
  width:92px;height:92px;border-radius:999px;object-fit:cover;border:2px solid #0e1f3b;
}
.execs__avatar--placeholder{background:#223a63}
.execs__name{margin-top:8px;font-weight:700}
.execs__role{font-size:12px;opacity:.8}
`;
