import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listPublicAlbums, type PublicAlbum } from "../lib/albums";
import liberianHeadlines from "../assets/Liberian Headlines.png";

/** En enkel mappe-ikonkomponent (SVG) */
function FolderIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" aria-hidden="true" className={className} role="img" focusable="false">
      <defs>
        <linearGradient id="fgrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopOpacity="1" />
          <stop offset="1" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M6 18h20c2.2 0 3.2-1.8 4.1-3.1 1-1.5 1.6-2.3 3.4-2.3H54c2.8 0 5 2.2 5 5v7H6v-6.6c0-.55.45-1 1-1Z"
        style={{ fill: "url(#fgrad)" }}
        className="fi__top"
      />
      <rect x="6" y="20" width="60" height="30" rx="6" className="fi__body" />
      <path d="M9 22h54a3 3 0 0 1 3 3v18a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V25a3 3 0 0 1 3-3Z" className="fi__gloss" />
    </svg>
  );
}

export default function Photos() {
  const q = useQuery({
    queryKey: ["pubAlbums", 0, 48],
    queryFn: () => listPublicAlbums(0, 48),
  });

  // VIKTIG: trekk ut array uansett form
  const albums: PublicAlbum[] = useMemo(() => {
    const d: any = q.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.content)) return d.content;
    if (Array.isArray(d?._embedded?.albums)) return d._embedded.albums;
    return [];
  }, [q.data]);

  const isEmpty = !q.isLoading && !q.isError && albums.length === 0;

  return (
    <div className="photos">
      <Navbar />
      <main className="photos__wrap">
        {/* HERO */}
        <section className="photosHero" aria-label="Intro">
          <div className="photosHero__banner">
            <img
              src={liberianHeadlines}
              alt="Liberian headlines"
              className="heroBanner__img"
            />
          </div>

          <div className="photosHero__title">PHOTOS AND VIDEOS GALLERY</div>
        </section>



        {/* status */}
        {q.isLoading && <div className="photos__loading">Laster galleri…</div>}
        {q.isError && (
          <div className="photos__error">
            Kunne ikke hente album: {(q.error as Error)?.message || "ukjent feil"}
          </div>
        )}
        {isEmpty && <div className="photos__loading">Ingen album publisert ennå.</div>}

        {/* GRID */}
        {!q.isLoading && !q.isError && albums.length > 0 && (
          <ul className="folderGrid">
            {albums.map((a) => (
              <li key={a.slug ?? a.id} className="folderGrid__item">
                <Link to={`/albums/${a.slug}`} className="folder">
                  <FolderIcon className="folder__icon" />
                  <div className="folder__label" title={a.title}>
                    {a.eventTitle || a.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
      <style>{css}</style>
    </div>
  );
}

/* --------- STIL --------- */
const css = `
:root{
  --navy-900:#0f1d37;
  --navy-800:#15284b;
  --navy-700:#19335e;
  --navy-600:#1e4178;
  --ink:#0b1020;
  --paper:#ffffff;
  --muted:#9fb2cc;
  --teal:#29a3a3;
}

.photos{display:flex;flex-direction:column;min-height:100vh;background:#fff;}
.photos__wrap{flex:1;width:min(1200px,94vw);margin:0 auto;padding:28px 0 56px;}

.photosHero{position:relative;margin:18px 0 36px;display:grid;place-items:center}
.photosHero__banner{
  width:min(1100px,94vw);
  min-height:120px;
  border-radius:12px;
  background:#1e2f53;
  color:#e6eefc;
  display:grid;place-items:center;
  box-shadow:0 4px 16px rgba(13,26,46,.18);
  border:2px solid #0e1f3b;
  font-weight:600;
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

.photosHero__title{
  position:relative;
  margin-top:-36px;
  background:#fff;
  color:#111827;
  border-radius:10px;
  padding:18px 28px;
  font-weight:800;
  font-size:24px;
  letter-spacing:.6px;
  border:2px solid #0e1f3b;
  box-shadow:0 6px 20px rgba(12,18,32,.18);
}

.photos__loading{padding:18px;color:#1e2f53;font-weight:600}
.photos__error{padding:14px 16px;background:#b91c1c;color:#fff;border-radius:8px;font-weight:700}

.folderGrid{
  display:grid;
  grid-template-columns:repeat(4, minmax(0,1fr));
  gap:42px 48px;
  justify-items:center;
  padding:6px 8px 12px;
}
@media (max-width: 1100px){ .folderGrid{ grid-template-columns:repeat(3, minmax(0,1fr)); gap:36px 32px; } }
@media (max-width: 760px){  .folderGrid{ grid-template-columns:repeat(2, minmax(0,1fr)); gap:28px 24px; } }
@media (max-width: 460px){ .folderGrid{ grid-template-columns:1fr; gap:22px 18px; } }

.folder{display:grid;justify-items:center;text-decoration:none;outline:0}
.folder:focus .folder__label{box-shadow:0 0 0 3px rgba(41,163,163,.45);border-radius:6px}
.folder__icon{width:88px;height:68px;filter:drop-shadow(0 3px 6px rgba(13,26,46,.25));}
.folder__label{
  margin-top:10px;font-weight:600;color:#111827;font-size:14px;text-align:center;
  max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

.fi__top{ fill:#4d78a8; }
.fi__body{ fill:#3a6a9d; }
.fi__gloss{ fill:rgba(255,255,255,.08); }
.folder:hover .fi__top{ fill:#5b86b6; }
.folder:hover .fi__body{ fill:#4477ad; }
`;
