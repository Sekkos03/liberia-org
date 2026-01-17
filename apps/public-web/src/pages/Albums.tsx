import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listPublicAlbums, type PublicAlbum } from "../lib/albums";
import liberianHeadlines from "../assets/Liberian Headlines.png";
import DonationPopup from "../components/Donationpopup";

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

        {/* Status */}
        {q.isLoading && (
          <div className="photos__loading">
            <div className="spinner" />
            <p>Loading gallery…</p>
          </div>
        )}
        {q.isError && (
          <div className="photos__error">
            Could not load albums: {(q.error as Error)?.message || "unknown error"}
          </div>
        )}
        {isEmpty && (
          <div className="photos__empty">
            <span className="empty-icon">📁</span>
            <p>No albums published yet.</p>
          </div>
        )}

        {/* GRID */}
        {!q.isLoading && !q.isError && albums.length > 0 && (
          <ul className="folderGrid">
            {albums.map((a, idx) => (
              <li
                key={a.slug ?? a.id}
                className="folderGrid__item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
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
      </main>¨
      <DonationPopup />
      <Footer />
      <style>{css}</style>
    </div>
  );
}

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

.photos{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,0.08), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,0.1), transparent 60%),
    #fff;
}

.photos__wrap{
  flex:1;
  width:min(1200px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
}

@media (min-width: 640px) {
  .photos__wrap{padding:28px 0 56px;}
}

.photosHero{
  position:relative;
  margin:12px 0 24px;
  display:grid;
  place-items:center;
  animation:fadeInDown 0.6s ease;
}

@media (min-width: 640px) {
  .photosHero{margin:18px 0 36px;}
}

@keyframes fadeInDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.photosHero__banner{
  width:min(1100px,94vw);
  min-height:120px;
  border-radius:12px;
  background:#1e2f53;
  color:#e6eefc;
  display:grid;
  place-items:center;
  box-shadow:0 4px 16px rgba(13,26,46,0.18);
  border:2px solid #0e1f3b;
  font-weight:600;
  overflow:hidden;
  height:160px;
}

@media (min-width: 640px) {
  .photosHero__banner{height:240px;}
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
  margin-top:-24px;
  background:#fff;
  color:#111827;
  border-radius:8px;
  padding:12px 16px;
  font-weight:800;
  font-size:14px;
  letter-spacing:0.4px;
  border:2px solid #0e1f3b;
  box-shadow:0 6px 20px rgba(12,18,32,0.18);
  text-align:center;
  max-width:90%;
}

@media (min-width: 640px) {
  .photosHero__title{
    margin-top:-36px;
    border-radius:10px;
    padding:18px 28px;
    font-size:24px;
    letter-spacing:0.6px;
  }
}

.photos__loading{
  padding:40px 18px;
  color:#1e2f53;
  font-weight:600;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:16px;
}

.spinner{
  width:40px;
  height:40px;
  border:4px solid rgba(30,47,83,0.2);
  border-top-color:#1e2f53;
  border-radius:50%;
  animation:spin 1s linear infinite;
}

@keyframes spin{
  to{transform:rotate(360deg)}
}

.photos__error{
  padding:14px 16px;
  background:#b91c1c;
  color:#fff;
  border-radius:8px;
  font-weight:700;
  margin:0 8px;
  animation:shake 0.5s ease;
}

@keyframes shake{
  0%, 100%{transform:translateX(0)}
  25%{transform:translateX(-10px)}
  75%{transform:translateX(10px)}
}

.photos__empty{
  padding:60px 20px;
  text-align:center;
  color:#64748b;
}

.empty-icon{
  font-size:48px;
  display:block;
  margin-bottom:16px;
  opacity:0.5;
}

.folderGrid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0,1fr));
  gap:24px 20px;
  justify-items:center;
  padding:6px 8px 12px;
  list-style:none;
  margin:0;
}

@media (min-width: 640px){
  .folderGrid{
    grid-template-columns:repeat(3, minmax(0,1fr));
    gap:32px 28px;
  }
}

@media (min-width: 1024px){
  .folderGrid{
    grid-template-columns:repeat(4, minmax(0,1fr));
    gap:42px 48px;
  }
}

.folderGrid__item{
  animation:folderFadeIn 0.5s ease;
  animation-fill-mode:both;
}

@keyframes folderFadeIn{
  from{opacity:0;transform:translateY(20px) scale(0.9)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

.folder{
  display:grid;
  justify-items:center;
  text-decoration:none;
  outline:0;
  transition:all 0.3s ease;
}

.folder:hover{
  transform:translateY(-8px);
}

.folder:focus .folder__label{
  box-shadow:0 0 0 3px rgba(41,163,163,0.45);
  border-radius:6px;
}

.folder__icon{
  width:64px;
  height:50px;
  filter:drop-shadow(0 3px 6px rgba(13,26,46,0.25));
  transition:all 0.3s ease;
}

@media (min-width: 640px){
  .folder__icon{
    width:88px;
    height:68px;
  }
}

.folder:hover .folder__icon{
  filter:drop-shadow(0 8px 16px rgba(13,26,46,0.35));
  transform:scale(1.05);
}

.folder__label{
  margin-top:8px;
  font-weight:600;
  color:#111827;
  font-size:12px;
  text-align:center;
  max-width:140px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  transition:color 0.3s ease;
}

@media (min-width: 640px){
  .folder__label{
    margin-top:10px;
    font-size:14px;
    max-width:160px;
  }
}

.folder:hover .folder__label{
  color:#1e3a5f;
}

.fi__top{
  fill:#4d78a8;
  transition:fill 0.3s ease;
}

.fi__body{
  fill:#3a6a9d;
  transition:fill 0.3s ease;
}

.fi__gloss{
  fill:rgba(255,255,255,0.08);
}

.folder:hover .fi__top{
  fill:#5b86b6;
}

.folder:hover .fi__body{
  fill:#4477ad;
}
`;