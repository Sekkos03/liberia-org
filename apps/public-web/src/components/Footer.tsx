// src/components/Footer.tsx
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo" aria-label="Site footer">
      <div className="site-footer__inner">
        <p className="site-footer__text">
          Copyright © {year} Liberia organization Oslo Norway · Webdesign by{" "}
          <a
            className="site-footer__link"
            href="https://www.linkedin.com/in/sekou-kosiah-93b96325a/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Sekou Kosiah
          </a>
        </p>
      </div>
    </footer>
  );
}
