import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./home.css";
import DonationPopup from "../components/Donationpopup";

export default function Home() {
  return (
    <div className="page-root">
      <Navbar />

      <main className="home-hero">
        <div className="hero-inner">
          <h1 className="hero-title">ULAN</h1>
          <p className="hero-subtitle">Union Of Liberian Associtations in Norway</p>

          <div className="actions">
            <Link to="/membership" className="btn btn--primary">Join our community</Link>
            <Link to="/about" className="btn btn--ghost">Learn more</Link>
          </div>
        </div>
      </main>
      <DonationPopup />
      <Footer />
    </div>
  );
}
