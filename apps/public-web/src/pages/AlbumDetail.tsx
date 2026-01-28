import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getPublicAlbum, type AlbumItem } from "../lib/albums";
import { pickImageSrc, stripStoredFileToString, toPublicUrl } from "../lib/media";

export default function AlbumDetail() {
  const { slug = "" } = useParams();
  const q = useQuery({
    queryKey: ["pubAlbum", slug],
    queryFn: () => getPublicAlbum(slug),
    enabled: !!slug,
  });

  const images = useMemo<AlbumItem[]>(
    () => (q.data?.items ?? []).filter((x) => x.kind === "IMAGE"),
    [q.data]
  );
  const videos = useMemo<AlbumItem[]>(
    () => (q.data?.items ?? []).filter((x) => x.kind === "VIDEO"),
    [q.data]
  );

  const title = q.data?.album?.eventTitle || q.data?.album?.title || "Album";
  const [lightbox, setLightbox] = useState<{ url: string; kind: "IMAGE" | "VIDEO" } | null>(null);

  // Lock scroll when lightbox is open
  useEffect(() => {
    if (!lightbox) return;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [lightbox]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox]);

  return (
    <div className="album">
      <Navbar />
      <main className="album__wrap">
        {/* HERO */}
        <section className="hero" aria-label="Album hero">
          <div className="hero__frame">
            <div className="hero__stage">
              {q.isError && (
                <div className="hero__error">
                  Error: {(q.error as Error)?.message || "Unknown error"}
                </div>
              )}
              {q.isLoading && <div className="hero__empty">Loading album…</div>}
              {!q.isLoading && !q.isError && (
                <div className="hero__title">{title}</div>
              )}
            </div>
          </div>
        </section>

        {/* BACK LINK */}
        {!q.isLoading && !q.isError && (
          <div className="backLinkWrapper">
            <Link to="/albums" className="backLink">
              ← Back to Albums
            </Link>
          </div>
        )}

        {/* LISTS */}
        {!q.isLoading && !q.isError && (
          <div className="lists">
            {/* IMAGES */}
            <div className="listCol">
              <div className="listCol__head">
                <h2>
                  <span className="icon">📷</span>
                  Photos
                </h2>
                <span className="listCol__count">{images.length}</span>
              </div>
              {images.length === 0 ? (
                <p className="muted">No images published.</p>
              ) : (
                <ul className="cards">
                  {images.map((it, idx) => (
                    <li
                      key={(it.id ?? idx) + "-img"}
                      className="card"
                      onClick={() => setLightbox({ url: it.url, kind: "IMAGE" })}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="card__thumb">
                        {(() => {
                          const full = toPublicUrl(stripStoredFileToString(it.url));
                          const thumb = it.thumbUrl
                            ? toPublicUrl(stripStoredFileToString(it.thumbUrl))
                            : full;

                          return (
                            <img
                              src={thumb}
                              alt="Bilde"
                              loading="lazy"
                              onError={(e) => {
                                if (e.currentTarget.src !== full) e.currentTarget.src = full;
                              }}
                            />
                          );
                        })()}
                        <div className="card__overlay">
                          <span className="view-icon">👁️</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* VIDEOS */}
            <div className="listCol">
              <div className="listCol__head">
                <h2>
                  <span className="icon">🎥</span>
                  Videos
                </h2>
                <span className="listCol__count">{videos.length}</span>
              </div>
              {videos.length === 0 ? (
                <p className="muted">No videos published.</p>
              ) : (
                <ul className="cards">
                  {videos.map((it, idx) => (
                    <li
                      key={(it.id ?? idx) + "-vid"}
                      className="card"
                      onClick={() => setLightbox({ url: it.url, kind: "VIDEO" })}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="card__thumb">
                        <video src={toPublicUrl(it.url)} preload="metadata" muted playsInline />
                        <div className="card__overlay card__overlay--video">
                          <span className="play-badge">▶</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox__close"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="lightbox__media">
              {lightbox.kind === "VIDEO" || /\.(mp4|webm|ogg|mkv|mov)$/i.test(lightbox.url) ? (
                <video src={toPublicUrl(lightbox.url)} controls autoPlay playsInline />
              ) : (
                <img src={toPublicUrl(lightbox.url)} alt="Bilde" />
              )}
            </div>
          </div>
        </div>
      )}
      <style>{css}</style>
    </div>
  );
}

const css = `
.album{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,0.08), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,0.1), transparent 60%),
    #fff;
}

.album__wrap{
  flex:1;
  width:min(1200px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
}

@media (min-width: 640px) {
  .album__wrap{padding:28px 0 56px;}
}

.hero{
  margin:12px auto 20px;
  animation:fadeInDown 0.6s ease;
}

@media (min-width: 640px) {
  .hero{margin:12px auto 28px;}
}

@keyframes fadeInDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.hero__frame{
  position:relative;
  background:linear-gradient(135deg, #152843 0%, #1e3a5f 100%);
  border-radius:12px;
  padding:20px;
  box-shadow:0 10px 30px rgba(12,18,32,0.2);
  border:1px solid rgba(255,255,255,0.1);
}

@media (min-width: 640px) {
  .hero__frame{
    border-radius:20px;
    padding:28px;
  }
}

.hero__stage{
  min-height:80px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
  overflow:hidden;
  color:#e6eef9;
  font-weight:800;
  font-size:18px;
}

@media (min-width: 640px) {
  .hero__stage{
    min-height:120px;
    border-radius:16px;
    font-size:22px;
  }
}

.hero__empty{
  color:#cbd5e1;
  font-size:13px;
}

@media (min-width: 640px) {
  .hero__empty{font-size:15px;}
}

.hero__error{
  background:#b91c1c;
  color:#fff;
  padding:8px 12px;
  border-radius:8px;
  font-weight:600;
  font-size:13px;
}

@media (min-width: 640px) {
  .hero__error{
    padding:10px 14px;
    font-size:14px;
  }
}

.hero__title{
  background:#fff;
  color:#0f1d37;
  border:2px solid #0e1f3b;
  border-radius:8px;
  padding:8px 12px;
  box-shadow:0 6px 18px rgba(12,18,32,0.18);
  text-align:center;
  max-width:90%;
}

@media (min-width: 640px) {
  .hero__title{
    border-radius:10px;
    padding:10px 14px;
  }
}

.backLinkWrapper{
  margin:0 8px 16px;
}

@media (min-width: 640px) {
  .backLinkWrapper{margin:0 8px 20px;}
}

.backLink{
  display:inline-flex;
  align-items:center;
  gap:4px;
  color:#1e3a5f;
  font-weight:600;
  font-size:13px;
  text-decoration:none;
  transition:color 0.2s ease;
}

@media (min-width: 640px) {
  .backLink{font-size:14px;}
}

.backLink:hover{
  color:#10b981;
}

.lists{
  display:grid;
  grid-template-columns:1fr;
  gap:20px;
}

@media (min-width: 900px) {
  .lists{
    grid-template-columns:1fr 1fr;
    gap:28px;
  }
}

.listCol{
  background:linear-gradient(135deg, #0f2139 0%, #1e3a5f 100%);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:12px;
  padding:14px 12px 16px;
  box-shadow:0 6px 18px rgba(13,26,46,0.12);
  animation:slideUp 0.5s ease;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .listCol{
    border-radius:18px;
    padding:18px 16px 20px;
  }
}

.listCol:nth-child(1){animation-delay:0.1s}
.listCol:nth-child(2){animation-delay:0.2s}

@keyframes slideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

.listCol__head{
  display:flex;
  align-items:center;
  gap:8px;
  margin:0 4px 10px;
}

@media (min-width: 640px) {
  .listCol__head{
    gap:10px;
    margin:0 6px 12px;
  }
}

.listCol h2{
  font-size:16px;
  font-weight:800;
  color:#e7eef9;
  margin:0;
  display:flex;
  align-items:center;
  gap:6px;
}

@media (min-width: 640px) {
  .listCol h2{
    font-size:20px;
    gap:8px;
  }
}

.icon{font-size:18px;}

@media (min-width: 640px) {
  .icon{font-size:20px;}
}

.listCol__count{
  background:rgba(16,185,129,0.2);
  color:#6ee7b7;
  border:1px solid rgba(16,185,129,0.3);
  padding:2px 7px;
  border-radius:999px;
  font-size:11px;
  font-weight:600;
}

@media (min-width: 640px) {
  .listCol__count{
    padding:2px 8px;
    font-size:12px;
  }
}

.muted{
  color:#9fb2cc;
  margin:8px;
  font-size:13px;
}

@media (min-width: 640px) {
  .muted{font-size:14px;}
}

.cards{
  display:grid;
  grid-template-columns:1fr;
  gap:10px;
  list-style:none;
  padding:0;
  margin:0;
}

@media (min-width: 520px) {
  .cards{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px;
  }
}

@media (min-width: 1100px) {
  .cards{
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:14px;
  }
}

.card{
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:12px;
  overflow:hidden;
  cursor:pointer;
  box-shadow:0 4px 12px rgba(13,26,46,0.12);
  transition:all 0.3s ease;
  animation:cardFadeIn 0.4s ease;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .card{border-radius:16px;}
}

@keyframes cardFadeIn{
  from{opacity:0;transform:translateY(20px)}
  to{opacity:1;transform:translateY(0)}
}

.card:hover{
  transform:translateY(-4px);
  box-shadow:0 12px 24px rgba(13,26,46,0.2);
  border-color:rgba(16,185,129,0.3);
}

.card__thumb{
  aspect-ratio:16/9;
  background:#0b1a2d;
  display:grid;
  place-items:center;
  overflow:hidden;
  position:relative;
}

.card__thumb img,
.card__thumb video{
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform 0.5s ease;
}

.card:hover .card__thumb img,
.card:hover .card__thumb video{
  transform:scale(1.1);
}

.card__overlay{
  position:absolute;
  inset:0;
  background:linear-gradient(to top, rgba(0,0,0,0.5), transparent);
  opacity:0;
  transition:opacity 0.3s ease;
  display:flex;
  align-items:center;
  justify-content:center;
}

.card__overlay--video{
  opacity:1;
  background:linear-gradient(to top, rgba(0,0,0,0.4), transparent 60%);
}

.card:hover .card__overlay{
  opacity:1;
}

.view-icon{
  font-size:32px;
  filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}

.play-badge{
  width:48px;
  height:48px;
  border-radius:50%;
  background:rgba(16,185,129,0.9);
  backdrop-filter:blur(8px);
  display:grid;
  place-items:center;
  color:#fff;
  font-size:18px;
  box-shadow:0 4px 16px rgba(16,185,129,0.4);
  transition:transform 0.3s ease;
}

.card:hover .play-badge{
  transform:scale(1.1);
}

.lightbox{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.9);
  backdrop-filter:blur(8px);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
  padding:12px;
  animation:fadeIn 0.3s ease;
}

@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}

.lightbox__inner{
  background:linear-gradient(135deg, #0c1728 0%, #1e3a5f 100%);
  border:1px solid rgba(255,255,255,0.15);
  border-radius:12px;
  padding:12px;
  max-width:min(95vw,1100px);
  max-height:90vh;
  position:relative;
  animation:slideUp 0.4s ease;
  display:flex;
  flex-direction:column;
}

@media (min-width: 640px) {
  .lightbox__inner{
    border-radius:16px;
    padding:14px;
  }
}

.lightbox__media{
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  border-radius:8px;
}

@media (min-width: 640px) {
  .lightbox__media{border-radius:10px;}
}

.lightbox__media img,
.lightbox__media video{
  max-width:100%;
  max-height:calc(90vh - 80px);
  object-fit:contain;
}

.lightbox__close{
  position:absolute;
  top:10px;
  right:10px;
  background:rgba(255,255,255,0.9);
  border:none;
  border-radius:8px;
  height:32px;
  width:32px;
  cursor:pointer;
  font-size:16px;
  display:grid;
  place-items:center;
  transition:all 0.3s ease;
  z-index:10;
}

@media (min-width: 640px) {
  .lightbox__close{
    top:12px;
    right:12px;
    height:36px;
    width:36px;
    font-size:18px;
  }
}

.lightbox__close:hover{
  background:#fff;
  transform:rotate(90deg);
}
`;