import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PDF_URL = "/src/assets/Constitution_Liberia.pdf";

export default function Constitution() {
  return (
    <div className="cons">
      <Navbar />

      <main className="cons__wrap">
        <div className="cons__header">
          <h1 className="cons__title">
            <span className="cons__icon">📜</span>
            <span>Constitution</span>
          </h1>
          <Link to="/about" className="cons__back">
            <span className="cons__backIcon">←</span>
            <span className="cons__backText">Back</span>
          </Link>
        </div>

        <div className="cons__actions">
          <a href={PDF_URL} className="cons__download" download>
            <span className="downloadIcon">📥</span>
            <span>Download Constitution PDF</span>
          </a>
        </div>

        <div className="cons__viewer">
          <object data={PDF_URL} type="application/pdf" className="cons__object">
            <div className="cons__fallback">
              <div className="fallback__icon">📄</div>
              <p className="fallback__text">
                PDF preview not available in your browser.
              </p>
              <a href={PDF_URL} className="fallback__link" download>
                Click here to download the PDF
              </a>
            </div>
          </object>
        </div>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

const css = `
.cons{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,0.08), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,0.1), transparent 60%),
    #fff;
}

.cons__wrap{
  flex:1;
  width:min(1100px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
}

@media (min-width: 640px) {
  .cons__wrap{padding:24px 0 56px;}
}

.cons__header{
  display:flex;
  flex-direction:column;
  gap:12px;
  margin-bottom:16px;
  animation:fadeInDown 0.6s ease;
}

@media (min-width: 640px) {
  .cons__header{
    flex-direction:row;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    margin-bottom:20px;
  }
}

@keyframes fadeInDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.cons__title{
  background:linear-gradient(135deg, #1e2f53 0%, #16254a 100%);
  color:#e6eefc;
  border:2px solid rgba(255,255,255,0.1);
  border-radius:10px;
  padding:12px 16px;
  font-weight:900;
  letter-spacing:0.3px;
  font-size:18px;
  margin:0;
  display:flex;
  align-items:center;
  gap:10px;
  box-shadow:0 4px 12px rgba(14,31,59,0.3);
}

@media (min-width: 640px) {
  .cons__title{
    padding:14px 18px;
    font-size:20px;
    gap:12px;
  }
}

.cons__icon{
  font-size:22px;
}

@media (min-width: 640px) {
  .cons__icon{font-size:26px;}
}

.cons__back{
  background:linear-gradient(135deg, #1e2f53 0%, #16254a 100%);
  color:#e6eefc;
  border:1px solid rgba(255,255,255,0.1);
  border-radius:8px;
  padding:10px 14px;
  text-decoration:none;
  font-weight:600;
  display:inline-flex;
  align-items:center;
  gap:6px;
  transition:all 0.3s ease;
  font-size:13px;
  align-self:flex-start;
}

@media (min-width: 640px) {
  .cons__back{
    padding:12px 16px;
    font-size:14px;
    gap:8px;
    align-self:auto;
  }
}

.cons__back:hover{
  background:linear-gradient(135deg, #16254a 0%, #1e3a5f 100%);
  transform:translateX(-4px);
  box-shadow:0 4px 12px rgba(14,31,59,0.3);
}

.cons__backIcon{
  font-size:16px;
}

@media (min-width: 640px) {
  .cons__backIcon{font-size:18px;}
}

.cons__backText{
  display:none;
}

@media (min-width: 640px) {
  .cons__backText{display:inline;}
}

.cons__actions{
  margin:0 0 16px;
  animation:slideUp 0.5s ease;
  animation-delay:0.1s;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .cons__actions{margin:0 0 20px;}
}

@keyframes slideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

.cons__download{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 16px;
  background:linear-gradient(135deg, #10b981 0%, #059669 100%);
  color:#fff;
  text-decoration:none;
  border-radius:8px;
  font-weight:700;
  font-size:13px;
  transition:all 0.3s ease;
  box-shadow:0 4px 12px rgba(16,185,129,0.3);
  border:1px solid rgba(255,255,255,0.2);
}

@media (min-width: 640px) {
  .cons__download{
    padding:12px 18px;
    font-size:14px;
    gap:10px;
  }
}

.cons__download:hover{
  background:linear-gradient(135deg, #059669 0%, #047857 100%);
  transform:translateY(-3px);
  box-shadow:0 8px 20px rgba(16,185,129,0.4);
}

.downloadIcon{
  font-size:18px;
}

@media (min-width: 640px) {
  .downloadIcon{font-size:20px;}
}

.cons__viewer{
  background:linear-gradient(135deg, #16284a 0%, #1e3a5f 100%);
  border:2px solid rgba(255,255,255,0.1);
  border-radius:12px;
  padding:12px;
  min-height:400px;
  display:grid;
  place-items:center;
  box-shadow:0 10px 30px rgba(0,0,0,0.15);
  animation:slideUp 0.5s ease;
  animation-delay:0.2s;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .cons__viewer{
    min-height:70vh;
    padding:16px;
  }
}

.cons__object{
  width:100%;
  height:500px;
  border-radius:8px;
  background:#fff;
}

@media (min-width: 640px) {
  .cons__object{
    height:68vh;
    border-radius:10px;
  }
}

.cons__fallback{
  color:#e6eefc;
  text-align:center;
  padding:40px 20px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:16px;
}

@media (min-width: 640px) {
  .cons__fallback{
    padding:60px 40px;
    gap:20px;
  }
}

.fallback__icon{
  font-size:64px;
  opacity:0.7;
  animation:float 3s ease-in-out infinite;
}

@media (min-width: 640px) {
  .fallback__icon{font-size:80px;}
}

@keyframes float{
  0%, 100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}
}

.fallback__text{
  margin:0;
  font-size:14px;
  opacity:0.9;
  max-width:400px;
}

@media (min-width: 640px) {
  .fallback__text{font-size:16px;}
}

.fallback__link{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:12px 20px;
  background:linear-gradient(135deg, #10b981 0%, #059669 100%);
  color:#fff;
  text-decoration:none;
  border-radius:8px;
  font-weight:700;
  font-size:14px;
  transition:all 0.3s ease;
  margin-top:8px;
}

@media (min-width: 640px) {
  .fallback__link{
    padding:14px 24px;
    font-size:15px;
    margin-top:12px;
  }
}

.fallback__link:hover{
  background:linear-gradient(135deg, #059669 0%, #047857 100%);
  transform:translateY(-3px);
  box-shadow:0 8px 20px rgba(16,185,129,0.4);
}
`;