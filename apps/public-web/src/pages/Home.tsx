import { Link } from "react-router-dom";
// Update the import path if Navbar is located elsewhere, for example:
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// Or create the Navbar.tsx file in ../components/ if it does not exist.
import "./home.css";

export default function Home() {
  return (
    <div>
        <Navbar />
    <div className="page-frame">
      {/* Hero */}
      <main className="hero">
        <h1 className="hero__title">Liberian Organization</h1>
        <p className="hero__subtitle">In union with Norway</p>

        <div className="hero__cta">
          <Link to="/forms" className="btn btn--primary">Join our community</Link>
          <Link to="/about" className="btn btn--ghost">Learn more</Link>
        </div>
      </main>

      
    </div>
    <Footer/>
    </div>
  );
}
