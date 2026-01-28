import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import constitutionPdf from "../assets/Constitution_Liberia.pdf";

export default function Constitution() {
  const [isMobile, setIsMobile] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Detect mobile devices (iOS, Android, etc.)
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      // Also check for touch devices with small screens
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleOpenPdf = () => {
    window.open(constitutionPdf, "_blank");
  };

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
          <a href={constitutionPdf} className="cons__download" download="ULAN_Constitution.pdf">
            <span className="downloadIcon">📥</span>
            <span>Download Constitution PDF</span>
          </a>
          {isMobile && (
            <button onClick={handleOpenPdf} className="cons__openBtn">
              <span className="openIcon">🔗</span>
              <span>Open in New Tab</span>
            </button>
          )}
        </div>

        <div className="cons__viewer">
          {isMobile ? (
            // Mobile: Show a nice card with options since embedded PDF doesn't work well
            <div className="cons__mobileCard">
              <div className="mobileCard__icon">📄</div>
              <h2 className="mobileCard__title">ULAN Constitution</h2>
              <p className="mobileCard__text">
                For the best viewing experience on mobile devices, please download the PDF or open it in a new tab.
              </p>
              <div className="mobileCard__buttons">
                <a href={constitutionPdf} className="mobileCard__btn mobileCard__btn--primary" download="ULAN_Constitution.pdf">
                  <span>📥</span>
                  <span>Download PDF</span>
                </a>
                <button onClick={handleOpenPdf} className="mobileCard__btn mobileCard__btn--secondary">
                  <span>🔗</span>
                  <span>Open in Browser</span>
                </button>
              </div>
            </div>
          ) : (
            // Desktop: Use embed which works better than iframe for PDFs
            <>
              {!loadError ? (
                <embed
                  src={`${constitutionPdf}#toolbar=0&navpanes=0&scrollbar=1`}
                  type="application/pdf"
                  className="cons__embed"
                  onError={() => setLoadError(true)}
                />
              ) : (
                <div className="cons__fallback">
                  <div className="fallback__icon">📄</div>
                  <p className="fallback__text">
                    PDF preview not available in your browser.
                  </p>
                  <a href={constitutionPdf} className="fallback__link" download="ULAN_Constitution.pdf">
                    Click here to download the PDF
                  </a>
                </div>
              )}
            </>
          )}
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
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

@media (min-width: 640px) {
  .cons__actions{margin:0 0 20px;gap:12px;}
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

.cons__openBtn{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 16px;
  background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color:#fff;
  border:1px solid rgba(255,255,255,0.2);
  border-radius:8px;
  font-weight:700;
  font-size:13px;
  cursor:pointer;
  transition:all 0.3s ease;
  box-shadow:0 4px 12px rgba(59,130,246,0.3);
}

@media (min-width: 640px) {
  .cons__openBtn{
    padding:12px 18px;
    font-size:14px;
    gap:10px;
  }
}

.cons__openBtn:hover{
  background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform:translateY(-3px);
  box-shadow:0 8px 20px rgba(59,130,246,0.4);
}

.downloadIcon, .openIcon{
  font-size:18px;
}

@media (min-width: 640px) {
  .downloadIcon, .openIcon{font-size:20px;}
}

.cons__viewer{
  background:linear-gradient(135deg, #16284a 0%, #1e3a5f 100%);
  border:2px solid rgba(255,255,255,0.1);
  border-radius:12px;
  padding:12px;
  min-height:400px;
  display:flex;
  align-items:center;
  justify-content:center;
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

.cons__embed{
  width:100%;
  height:500px;
  border:none;
  border-radius:8px;
  background:#fff;
}

@media (min-width: 640px) {
  .cons__embed{
    height:68vh;
    border-radius:10px;
  }
}

/* Mobile Card Styles */
.cons__mobileCard{
  background:linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border:1px solid rgba(255,255,255,0.15);
  border-radius:16px;
  padding:32px 24px;
  text-align:center;
  max-width:400px;
  width:100%;
  backdrop-filter:blur(10px);
}

@media (min-width: 640px) {
  .cons__mobileCard{
    padding:48px 40px;
  }
}

.mobileCard__icon{
  font-size:64px;
  margin-bottom:16px;
  animation:float 3s ease-in-out infinite;
}

@media (min-width: 640px) {
  .mobileCard__icon{
    font-size:80px;
    margin-bottom:20px;
  }
}

@keyframes float{
  0%, 100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}
}

.mobileCard__title{
  color:#fff;
  font-size:20px;
  font-weight:800;
  margin:0 0 12px;
}

@media (min-width: 640px) {
  .mobileCard__title{
    font-size:24px;
    margin:0 0 16px;
  }
}

.mobileCard__text{
  color:rgba(255,255,255,0.8);
  font-size:14px;
  line-height:1.6;
  margin:0 0 24px;
}

@media (min-width: 640px) {
  .mobileCard__text{
    font-size:15px;
    margin:0 0 32px;
  }
}

.mobileCard__buttons{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.mobileCard__btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding:14px 20px;
  border-radius:10px;
  font-weight:700;
  font-size:14px;
  text-decoration:none;
  cursor:pointer;
  transition:all 0.3s ease;
  border:none;
}

@media (min-width: 640px) {
  .mobileCard__btn{
    padding:16px 24px;
    font-size:15px;
  }
}

.mobileCard__btn--primary{
  background:linear-gradient(135deg, #10b981 0%, #059669 100%);
  color:#fff;
  box-shadow:0 4px 12px rgba(16,185,129,0.4);
}

.mobileCard__btn--primary:hover{
  background:linear-gradient(135deg, #059669 0%, #047857 100%);
  transform:translateY(-2px);
  box-shadow:0 6px 16px rgba(16,185,129,0.5);
}

.mobileCard__btn--secondary{
  background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color:#fff;
  box-shadow:0 4px 12px rgba(59,130,246,0.4);
}

.mobileCard__btn--secondary:hover{
  background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform:translateY(-2px);
  box-shadow:0 6px 16px rgba(59,130,246,0.5);
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