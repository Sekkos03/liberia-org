import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DonationPopup from "../components/Donationpopup";
import liberianHeadlines from "../assets/Liberian Headlines.png";
import jayPhoto from "../assets/jay.png";
import nelsonPhoto from "../assets/nelson.png";
import joycePhoto from "../assets/joyce.png";
import kulaPhoto from "../assets/kula.png";
import irvinPhoto from "../assets/irvin.png";

const ANON_AVATAR =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20128%20128%27%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%0A%3Cstop%20offset%3D%270%27%20stop-color%3D%27%231e3a8a%27/%3E%0A%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230b1e35%27/%3E%0A%3C/linearGradient%3E%0A%3C/defs%3E%0A%3Crect%20width%3D%27128%27%20height%3D%27128%27%20rx%3D%2764%27%20fill%3D%27url(%23g)%27/%3E%0A%3Ccircle%20cx%3D%2764%27%20cy%3D%2752%27%20r%3D%2722%27%20fill%3D%27rgba(255%2C255%2C255%2C0.88)%27/%3E%0A%3Cpath%20d%3D%27M24%20116c8-22%2024-32%2040-32s32%2010%2040%2032%27%20fill%3D%27rgba(255%2C255%2C255%2C0.88)%27/%3E%0A%3C/svg%3E";

type Executive = {
  id: string | number;
  name: string;
  title?: string;
  photoUrl?: string;
  photoPosition?: string; // Custom object-position for each photo
};

const executives: Executive[] = [
  { id: 1, name: "Irvin Wallace Kofa Sr.", title: "President", photoUrl: irvinPhoto, photoPosition: "center 60%" },
  { id: 2, name: "Joyce Breeze Kamara", title: "Vice President", photoUrl: joycePhoto, photoPosition: "center center" },
  { id: 3, name: "Kula Emmanuella Koroma Forsther", title: "Secretary General", photoUrl: kulaPhoto, photoPosition: "center center" },
  { id: 4, name: "Nelson S. Forsther", title: "National Treasurer", photoUrl: nelsonPhoto, photoPosition: "center 60%" },
  { id: 5, name: "Jay Justin Kwitee Jr.", title: "Financial Secretary", photoUrl: jayPhoto, photoPosition: "center top" },
];

export default function AboutUs() {
  return (
    <div className="about">
      <Navbar />
      <DonationPopup />

      <main className="aboutWrap">
        {/* Hero */}
        <section className="aboutHero" aria-label="Intro">
          <div className="aboutHero__inner">
            <img src={liberianHeadlines} alt="Liberian Headlines" className="aboutHero__img" />
          </div>
          <div className="aboutHero__title">About Us</div>
        </section>

        {/* Buttons */}
        <section className="aboutBtns">
          <Link className="pillBtn" to="/about/constitution">
            <span className="pillBtn__icon">📜</span>
            <span>Constitution</span>
          </Link>
          <a
            className="pillBtn"
            href="https://www.whatsapp.com/legal/terms-of-service"
            target="_blank"
            rel="noreferrer"
          >
            <span className="pillBtn__icon">💬</span>
            <span>WhatsApp Guidelines</span>
          </a>
        </section>

        {/* Text */}
        <section className="aboutBox">
          <div className="aboutBox__icon">ℹ️</div>
          <div className="aboutBox__content">
            <h2 className="aboutBox__title">Who We Are</h2>
            <p className="aboutBox__text">
              ULAN is a non governmental organization based in Norway that carries out charitable socioeconomic
              developments in Liberia through five thematic areas: Health, Education, Agriculture, Microfinance,
              and Emergency Relief in Liberia (commonly known as the <strong>HEAMER PROJECTS</strong>).
            </p>
            <p className="aboutBox__text">
              The nonprofit charitable organization, which is run by Liberians residing in the Kingdom of Norway
              and Liberia respectively, was established in 2005 in the Norwegian city of Kongsberg.
            </p>
          </div>
        </section>

        {/* EXECUTIVES */}
        <div className="execsSection">
          <h2 className="execs__title">
            <span className="execs__titleIcon">👥</span>
            The Executives
          </h2>
          <section className="execs">
            {executives.map((x, idx) => (
              <div
                key={x.id}
                className="execs__card"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="execs__avatarWrap">
                  <img
                    src={x.photoUrl ?? ANON_AVATAR}
                    className="execs__avatar"
                    alt={x.name}
                    loading="lazy"
                    style={x.photoPosition ? { objectPosition: x.photoPosition } : undefined}
                  />
                </div>
                {x.title && <div className="execs__role">{x.title}</div>}
                <div className="execs__name">{x.name}</div>
              </div>
            ))}
          </section>
        </div>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

const css = `
.about{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,0.08), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,0.1), transparent 60%),
    #fff;
}

.aboutWrap{
  flex:1;
  width:min(1100px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
}

@media (min-width: 640px) {
  .aboutWrap{padding:24px 0 50px;}
}

.aboutHero{
  margin-top:8px;
  animation:fadeInDown 0.6s ease;
}

@keyframes fadeInDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.aboutHero__inner{
  background:linear-gradient(135deg, #1e2f53 0%, #16254a 100%);
  border:2px solid #0e1f3b;
  border-radius:12px;
  min-height:120px;
  display:grid;
  place-items:center;
  color:#cfe0fa;
  box-shadow:0 10px 30px rgba(12,18,32,0.2);
  overflow:hidden;
  height:160px;
}

@media (min-width: 640px) {
  .aboutHero__inner{
    border-radius:14px;
    min-height:140px;
    height:240px;
  }
}

.aboutHero__img{
  width:100%;
  height:100%;
  object-fit:contain;
  background:#fff;
  display:block;
}

.aboutHero__title{
  position:relative;
  width:min(620px,92%);
  margin:-24px auto 0;
  background:#fff;
  border:2px solid #0e1f3b;
  border-radius:8px;
  padding:12px 16px;
  text-align:center;
  font-weight:800;
  font-size:18px;
  box-shadow:0 6px 18px rgba(12,18,32,0.18);
}

@media (min-width: 640px) {
  .aboutHero__title{
    margin:-32px auto 0;
    border-radius:10px;
    padding:18px 24px;
    font-size:24px;
  }
}

.aboutBtns{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin:40px 0 20px;
}

@media (min-width: 640px) {
  .aboutBtns{
    flex-direction:row;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    margin:46px 0 20px;
  }
}

.pillBtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:12px 16px;
  border-radius:10px;
  background:linear-gradient(135deg, #0e1f3b 0%, #16254a 100%);
  color:#fff;
  text-decoration:none;
  font-weight:700;
  font-size:13px;
  transition:all 0.3s ease;
  box-shadow:0 4px 12px rgba(14,31,59,0.3);
  border:1px solid rgba(255,255,255,0.1);
}

@media (min-width: 640px) {
  .pillBtn{
    padding:12px 20px;
    font-size:14px;
  }
}

.pillBtn:hover{
  transform:translateY(-3px);
  box-shadow:0 8px 20px rgba(14,31,59,0.4);
  background:linear-gradient(135deg, #16254a 0%, #1e3a5f 100%);
}

.pillBtn__icon{
  font-size:16px;
}

@media (min-width: 640px) {
  .pillBtn__icon{font-size:18px;}
}

.aboutBox{
  background:linear-gradient(135deg, #0e1f3b 0%, #16254a 100%);
  color:#eaf2ff;
  border-radius:12px;
  padding:20px;
  box-shadow:0 10px 30px rgba(0,0,0,0.15);
  border:1px solid rgba(255,255,255,0.1);
  animation:slideUp 0.5s ease;
  animation-delay:0.2s;
  animation-fill-mode:both;
  display:flex;
  flex-direction:column;
  gap:16px;
}

@media (min-width: 640px) {
  .aboutBox{
    flex-direction:row;
    padding:24px 28px;
    gap:20px;
  }
}

@keyframes slideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

.aboutBox__icon{
  font-size:40px;
  flex-shrink:0;
  text-align:center;
}

@media (min-width: 640px) {
  .aboutBox__icon{
    font-size:48px;
    text-align:left;
  }
}

.aboutBox__content{
  flex:1;
}

.aboutBox__title{
  font-size:18px;
  font-weight:800;
  margin:0 0 12px;
  color:#fff;
}

@media (min-width: 640px) {
  .aboutBox__title{
    font-size:20px;
    margin:0 0 16px;
  }
}

.aboutBox__text{
  margin:0 0 12px;
  line-height:1.6;
  font-size:14px;
}

@media (min-width: 640px) {
  .aboutBox__text{
    font-size:15px;
    margin:0 0 16px;
  }
}

.aboutBox__text:last-child{
  margin-bottom:0;
}

.aboutBox__text strong{
  color:#6ee7b7;
  font-weight:700;
}

.execsSection{
  margin-top:32px;
  animation:slideUp 0.5s ease;
  animation-delay:0.3s;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .execsSection{margin-top:40px;}
}

.execs__title{
  margin:0 0 20px;
  text-align:center;
  font-weight:900;
  letter-spacing:0.06em;
  font-size:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  color:#0e1f3b;
}

@media (min-width: 640px) {
  .execs__title{
    font-size:18px;
    margin:0 0 24px;
  }
}

.execs__titleIcon{
  font-size:22px;
}

@media (min-width: 640px) {
  .execs__titleIcon{font-size:26px;}
}

.execs{
  background:linear-gradient(135deg, #0e1f3b 0%, #16254a 100%);
  border:2px solid rgba(255,255,255,0.1);
  border-radius:12px;
  padding:16px 12px;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:20px 16px;
  box-shadow:0 10px 30px rgba(0,0,0,0.15);
}

@media (min-width: 640px) {
  .execs{
    padding:20px 16px;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:24px 20px;
  }
}

@media (min-width: 960px) {
  .execs{
    padding:24px 20px;
    grid-template-columns:repeat(5,minmax(0,1fr));
    gap:28px 24px;
  }
}

.execs__card{
  display:grid;
  justify-items:center;
  text-align:center;
  animation:cardFadeIn 0.5s ease;
  animation-fill-mode:both;
  transition:transform 0.3s ease;
}

@keyframes cardFadeIn{
  from{opacity:0;transform:translateY(20px) scale(0.9)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

.execs__card:hover{
  transform:translateY(-8px);
}

.execs__avatarWrap{
  position:relative;
  margin-bottom:12px;
}

@media (min-width: 640px) {
  .execs__avatarWrap{margin-bottom:14px;}
}

.execs__avatar{
  width:95px;
  height:95px;
  border-radius:50%;
  object-fit:contain;
  object-position:center center;
  border:3px solid rgba(255,255,255,0.2);
  box-shadow:0 8px 20px rgba(0,0,0,0.3);
  transition:all 0.3s ease;
  background:#e8e8e8;
}

@media (min-width: 640px) {
  .execs__avatar{
    width:120px;
    height:120px;
  }
}

.execs__card:hover .execs__avatar{
  border-color:rgba(110,231,183,0.6);
  box-shadow:0 12px 30px rgba(0,0,0,0.4);
  transform:scale(1.05);
}

.execs__role{
  margin-top:8px;
  font-size:11px;
  letter-spacing:0.02em;
  opacity:0.85;
  color:#6ee7b7;
  font-weight:600;
  text-transform:uppercase;
}

@media (min-width: 640px) {
  .execs__role{
    margin-top:10px;
    font-size:12px;
  }
}

.execs__name{
  margin-top:6px;
  font-weight:800;
  color:#eaf2ff;
  font-size:13px;
  line-height:1.3;
}

@media (min-width: 640px) {
  .execs__name{
    margin-top:8px;
    font-size:14px;
  }
}
`;