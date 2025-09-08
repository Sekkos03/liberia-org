import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PDF_URL = "/assets/Sekou_Kosiah_CV_2025.pdf"; // <-- Sett korrekt sti/URL her

export default function Constitution() {
  return (
    <div className="cons">
      <Navbar />

      <main className="cons__wrap">
        <div className="cons__header">
          <h1 className="cons__title">CONSTITUTION</h1>
          <Link to="/about" className="cons__back">Return to About us</Link>
        </div>

        <a href={PDF_URL} className="cons__download">
          Download the constitution PDF file here
        </a>

        <div className="cons__viewer">
          {/* Browser-PDF viewer – faller tilbake til tekst dersom blokkert */}
          <object data={PDF_URL} type="application/pdf" className="cons__object">
            <div className="cons__fallback">PDF review</div>
          </object>
        </div>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

const css = `
.cons{display:flex;flex-direction:column;min-height:100vh;background:#fff}
.cons__wrap{flex:1;width:min(1100px,94vw);margin:0 auto;padding:24px 0 56px}
.cons__header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.cons__title{
  background:#1e2f53;color:#e6eefc;border:2px solid #0e1f3b;
  border-radius:10px;padding:8px 14px;font-weight:900;letter-spacing:.3px
}
.cons__back{
  background:#1e2f53;color:#e6eefc;border:1px solid #0e1f3b;border-radius:8px;padding:8px 12px;
  text-decoration:none
}
.cons__download{display:inline-block;margin:6px 2px 12px;color:#16254a;text-decoration:underline}
.cons__viewer{
  background:#16284a;border:1px solid #0e1f3b;border-radius:8px;padding:10px;
  min-height:70vh;display:grid;place-items:center
}
.cons__object{width:100%;height:68vh;border-radius:6px}
.cons__fallback{color:#e6eefc;opacity:.85}
`;
