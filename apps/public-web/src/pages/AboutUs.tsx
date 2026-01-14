import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import liberianHeadlines from "../assets/Liberian Headlines.png";
import jayPhoto from "../assets/jay.jpeg";

const ANON_AVATAR =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20128%20128%27%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%0A%3Cstop%20offset%3D%270%27%20stop-color%3D%27%231e3a8a%27/%3E%0A%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230b1e35%27/%3E%0A%3C/linearGradient%3E%0A%3C/defs%3E%0A%3Crect%20width%3D%27128%27%20height%3D%27128%27%20rx%3D%2764%27%20fill%3D%27url(%23g)%27/%3E%0A%3Ccircle%20cx%3D%2764%27%20cy%3D%2752%27%20r%3D%2722%27%20fill%3D%27rgba(255%2C255%2C255%2C0.88)%27/%3E%0A%3Cpath%20d%3D%27M24%20116c8-22%2024-32%2040-32s32%2010%2040%2032%27%20fill%3D%27rgba(255%2C255%2C255%2C0.88)%27/%3E%0A%3C/svg%3E";

type Executive = {
  id: string | number;
  name: string;
  title?: string;
  photoUrl?: string;
};

const executives: Executive[] = [
  { id: 1, name: "Irvin Wallace Sr Kofa", title: "President" },
  { id: 2, name: "Joyce Breeze Kamara", title: "Vice President" },
  { id: 3, name: "Kula Emmanuela Koroma Forsther", title: "Secretary General" },
  { id: 4, name: "Nelson S Forsther", title: "National Treasurer" },
  { id: 5, name: "Jay Justin Jr Kwitee", title: "Financial Secretary", photoUrl: jayPhoto },
];

export default function AboutUs() {
  return (
    <div className="about">
      <Navbar />

      <main className="aboutWrap">
        {/* Hero */}
        <section className="aboutHero" aria-label="Intro">
          <div className="aboutHero__inner">
            <img src={liberianHeadlines} alt="" className="aboutHero__img" />
          </div>
          <div className="aboutHero__title">About us</div>
        </section>

        {/* Buttons */}
        <section className="aboutBtns">
          <Link className="pillBtn" to="/about/constitution">
            CONSTITUTION
          </Link>
          <a
            className="pillBtn"
            href="https://www.whatsapp.com/legal/terms-of-service"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Guidelines
          </a>
        </section>

        {/* Text */}
        <section className="aboutBox">
          <p>
            ULAN is a non governmental organization basing in Norway that carries out charitable socioeconomic
            developments in Liberia through five thematic areas; Health, Education, Agriculture, Microfinance,
            and Emergency Relief in Liberia ( commonly known as the HEAMER PROJECTS). The nonprofit charitable
            organization, which is run by Liberians residing in the Kingdom of norway and Liberia respectively
            was established in 2005 in the Norwegian city of Kongsberg.
          </p>
        </section>

        {/* EXECUTIVES */}
        <h2 className="execs__title">THE EXECUTIVES</h2>
        <section className="execs">
          {executives.map((x) => (
            <div key={x.id} className="execs__card">
              <img
                src={x.photoUrl ?? ANON_AVATAR}
                className="execs__avatar"
                alt={x.name}
                loading="lazy"
              />
              {x.title && <div className="execs__role">{x.title}</div>}
              <div className="execs__name">{x.name}</div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

const css = `
.about{min-height:100vh;background:#fff}
.aboutWrap{width:min(1100px,94vw);margin:0 auto;padding:24px 0 50px}

.aboutHero{margin-top:8px}
.aboutHero__inner{
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

.aboutHero__img{
  width:100%;
  height:100%;
  object-fit:contain;
  background:#fff;
  display:block;
}
.aboutHero__titleWrap{
  position:absolute;
  left:50%;
  bottom:-20px;
  transform:translateX(-50%);
  background:#fff;
  border:2px solid #0e1f3b;
  border-radius:10px;
  padding:10px 24px;
  min-width:min(520px, 90vw);
  text-align:center;
}
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

.aboutBtns{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin:46px 0 16px;
}
.pillBtn{
  display:inline-block;
  padding:10px 18px;
  border-radius:10px;
  background:#0e1f3b;
  color:#fff;
  text-decoration:none;
  font-weight:800;
  font-size:13px;
}

.aboutBox{
  background:#0e1f3b;
  color:#eaf2ff;
  border-radius:12px;
  padding:18px 20px;
  box-shadow:0 14px 30px rgba(0,0,0,0.12);
}

.execs__title{
  margin:26px 0 14px;
  text-align:center;
  font-weight:900;
  letter-spacing:.06em;
  font-size:13px;
}

.execs{
  border:2px solid #0e1f3b;
  border-radius:12px;
  padding:18px 16px;
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:22px 26px;
}
@media (max-width: 960px){ .execs{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (max-width: 700px){ .execs{ grid-template-columns:repeat(2,minmax(0,1fr)); } }

.execs__card{display:grid;justify-items:center;text-align:center}
.execs__avatar{
  width:110px;height:110px;border-radius:999px;object-fit:cover;border:2px solid #0e1f3b;
}
.execs__role{margin-top:10px;font-size:12px;letter-spacing:.02em;opacity:.85}
.execs__name{margin-top:6px;font-weight:800}
`;
