// public-web/src/pages/Adverts.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchAdverts as loadAdverts, type Advert } from "../lib/adverts";
import { toPublicUrl } from "../lib/media";
import DonationPopup from "../components/Donationpopup";

const SLIDE_IMAGE_MS = 14000;

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function AdvertsPage() {
  const q = useQuery({
    queryKey: ["adverts"],
    queryFn: () => loadAdverts(0, 200),
  });

  const items = useMemo(() => {
    const list = (q.data ?? []).slice();
    const filtered = list.filter((a) => a.active !== false);
    filtered.sort((a, b) => {
      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      return db - da;
    });
    return filtered;
  }, [q.data]);

  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const current = items[idx] ?? null;

  const images = useMemo(
    () => items.filter((a) => (a.mediaKind ?? "IMAGE") === "IMAGE"),
    [items]
  );
  const videos = useMemo(
    () => items.filter((a) => (a.mediaKind ?? "IMAGE") === "VIDEO"),
    [items]
  );

  const prev = () => {
    if (items.length && !isTransitioning) {
      setIsTransitioning(true);
      setIdx((v) => (v - 1 + items.length) % items.length);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const next = () => {
    if (items.length && !isTransitioning) {
      setIsTransitioning(true);
      setIdx((v) => (v + 1) % items.length);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const goTo = (i: number) => {
    if (!isTransitioning && i !== idx) {
      setIsTransitioning(true);
      setIdx(i);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  useEffect(() => setIdx(0), [items.length]);

  // Slideshow with pause functionality
  useEffect(() => {
    if (!items.length || isPaused) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    const isVideo = current?.mediaKind === "VIDEO";
    if (isVideo) return;

    timerRef.current = window.setTimeout(() => {
      setIsTransitioning(true);
      setIdx((v) => (v + 1) % items.length);
      setTimeout(() => setIsTransitioning(false), 300);
    }, SLIDE_IMAGE_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [idx, items.length, current?.mediaKind, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [items.length, isTransitioning]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Global lightbox state
  const [lightboxItem, setLightboxItem] = useState<Advert | null>(null);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxItem(null);
    };
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxItem]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) next();
    if (isRightSwipe) prev();
  };

  return (
    <div className="adverts">
      <Navbar />

      <main className="wrap">
        <header className="pageHead">
          <h1 className="mainTitle">Adverts</h1>
          <p className="subtitle">Discover featured content and promotions</p>
        </header>

        <section
          className="hero"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button className="navBtn left" onClick={prev} aria-label="Previous" type="button">
            ‹
          </button>

          <div className="heroStage">
            {q.isLoading ? (
              <div className="empty">
                <div className="spinner" />
                <p>Loading amazing content...</p>
              </div>
            ) : current ? (
              <HeroSlide
                item={current}
                idx={idx}
                total={items.length}
                onVideoEnded={next}
                isTransitioning={isTransitioning}
              />
            ) : (
              <div className="empty">
                <p>No adverts published.</p>
              </div>
            )}
          </div>

          <button className="navBtn right" onClick={next} aria-label="Next" type="button">
            ›
          </button>

          {/* Pause/Play button */}
          {current?.mediaKind !== "VIDEO" && items.length > 1 && (
            <button
              className="pauseBtn"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Play" : "Pause"}
              type="button"
            >
              {isPaused ? "▶" : "⏸"}
            </button>
          )}

          {/* Progress bar for images */}
          {current?.mediaKind !== "VIDEO" && items.length > 1 && !isPaused && (
            <div className="progress">
              <span key={idx} className="bar" style={{ animationDuration: `${SLIDE_IMAGE_MS}ms` }} />
            </div>
          )}

          {/* Dot indicators */}
          {items.length > 1 && items.length <= 10 && (
            <div className="dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === idx ? "active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  type="button"
                />
              ))}
            </div>
          )}
        </section>

        <section className="lists">
          <div className="col">
            <div className="colHead">
              <h2>
                <span className="icon">🖼️</span>
                Image adverts
              </h2>
              <span className="pill">{images.length}</span>
            </div>

            {images.length === 0 ? (
              <p className="muted">No images available.</p>
            ) : (
              <div className="grid">
                {images.map((a, i) => (
                  <Card key={String(a.id)} item={a} index={i} onOpenLightbox={setLightboxItem} />
                ))}
              </div>
            )}
          </div>

          <div className="col">
            <div className="colHead">
              <h2>
                <span className="icon">🎥</span>
                Video adverts
              </h2>
              <span className="pill">{videos.length}</span>
            </div>

            {videos.length === 0 ? (
              <p className="muted">No videos available.</p>
            ) : (
              <div className="grid">
                {videos.map((a, i) => (
                  <Card key={String(a.id)} item={a} index={i} onOpenLightbox={setLightboxItem} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <DonationPopup />
      <Footer />

      {/* Global Lightbox Modal */}
      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      <style>{css}</style>
    </div>
  );
}

function HeroSlide({
  item,
  idx,
  total,
  onVideoEnded,
  isTransitioning,
}: {
  item: Advert;
  idx: number;
  total: number;
  onVideoEnded?: () => void;
  isTransitioning: boolean;
}) {
  const isVideo = item.mediaKind === "VIDEO";
  const src = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";
  const published = fmtDate(item.createdAt || item.updatedAt);

  return (
    <div className={`heroInner ${isTransitioning ? "transitioning" : ""}`}>
      <div className="heroMedia">
        {src ? (
          isVideo ? (
            <video
              key={String(item.id)}
              src={src}
              controls
              playsInline
              autoPlay
              onEnded={onVideoEnded}
            />
          ) : (
            <img src={src} alt={item.title} />
          )
        ) : (
          <div className="empty">No media</div>
        )}
      </div>

      <div className="heroMeta">
        <div>
          <div className="heroTitle">{item.title}</div>
          {published && <div className="heroSub">📅 Published: {published}</div>}
        </div>
        <div className="heroCount">{total > 0 ? `${idx + 1} / ${total}` : null}</div>
      </div>
    </div>
  );
}

function Card({ item, index, onOpenLightbox }: { item: Advert; index: number; onOpenLightbox: (item: Advert) => void }) {
  const isVideo = item.mediaKind === "VIDEO";
  const media = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";
  const published = fmtDate(item.createdAt || item.updatedAt);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article
      className="card"
      onClick={() => onOpenLightbox(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      style={{ animationDelay: `${index * 50}ms` }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenLightbox(item);
        }
      }}
    >
      <div className="thumb">
        {media ? (
          isVideo ? (
            <video src={media} muted playsInline preload="metadata" />
          ) : (
            <img src={media} alt={item.title} className={isHovered ? "zoomed" : ""} />
          )
        ) : (
          <div className="noimg">
            <span className="icon-placeholder">📷</span>
            <span>No media</span>
          </div>
        )}
        {isVideo && (
          <span className="badge">
            <span className="play-icon">▶</span>
          </span>
        )}
        <div className="overlay">
          <span className="view-text">Click to view</span>
        </div>
      </div>

      <div className="body">
        <h3>{item.title}</h3>
        {published && (
          <time>
            <span className="time-icon">📅</span>
            {published}
          </time>
        )}
      </div>
    </article>
  );
}

function Lightbox({ item, onClose }: { item: Advert; onClose: () => void }) {
  const isVideo = item.mediaKind === "VIDEO";
  const media = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";
  const published = fmtDate(item.createdAt || item.updatedAt);

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ✕
        </button>

        <div className="lightbox-media">
          {media ? (
            isVideo ? (
              <video src={media} controls autoPlay playsInline />
            ) : (
              <img src={media} alt={item.title} />
            )
          ) : (
            <div className="empty">No media</div>
          )}
        </div>

        <div className="lightbox-info">
          <h2 className="lightbox-title">{item.title}</h2>
          <div className="lightbox-meta">
            {published && (
              <div className="lightbox-date">
                <span className="icon">📅</span>
                {published}
              </div>
            )}
            {item.targetUrl && (
              <a className="linkBtn" href={item.targetUrl} target="_blank" rel="noreferrer">
                <span className="link-icon">🔗</span>
                Open link
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
.adverts{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,0.12), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,0.14), transparent 60%),
    #fff;
}

.wrap{
  flex:1;
  width:min(1200px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
}

@media (min-width: 640px) {
  .wrap{padding:28px 0 56px;}
}

.pageHead{
  margin:0 8px 18px 8px;
  text-align:center;
  animation:fadeInDown 0.6s ease;
  width:100%;
}

@keyframes fadeInDown{
  from{opacity:0;transform:translateY(-20px)}
  to{opacity:1;transform:translateY(0)}
}

.mainTitle{
  margin:0;
  font-size:32px;
  letter-spacing:-0.02em;
  font-weight:900;
  background:linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}

@media (min-width: 640px) {
  .mainTitle{font-size:44px;}
}

.subtitle{
  margin:6px 0 0;
  color:#64748b;
  font-size:14px;
}

@media (min-width: 640px) {
  .subtitle{font-size:16px;}
}

.hero{
  position:relative;
  background:linear-gradient(135deg, #0b1e35 0%, #1e3a5f 100%);
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.1);
  box-shadow:0 20px 50px rgba(0,0,0,0.2);
  padding:12px 40px 20px 40px;
  min-height:300px;
  overflow:hidden;
  animation:scaleIn 0.5s ease;
  width:100%;
}

@media (min-width: 640px) {
  .hero{
    border-radius:18px;
    padding:18px 52px 28px 52px;
    min-height:420px;
  }
}

@keyframes scaleIn{
  from{opacity:0;transform:scale(0.95)}
  to{opacity:1;transform:scale(1)}
}

.heroStage{
  display:flex;
  align-items:center;
  justify-content:center;
  height:100%;
}

.navBtn{
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  width:36px;
  height:36px;
  border-radius:10px;
  border:0;
  background:rgba(255,255,255,0.92);
  box-shadow:0 10px 20px rgba(0,0,0,0.25);
  cursor:pointer;
  font-size:22px;
  line-height:0;
  transition:all 0.3s ease;
  z-index:10;
}

@media (min-width: 640px) {
  .navBtn{
    width:42px;
    height:42px;
    border-radius:12px;
    font-size:26px;
  }
}

.navBtn:hover{
  background:rgba(255,255,255,1);
  transform:translateY(-50%) scale(1.1);
  box-shadow:0 15px 30px rgba(0,0,0,0.3);
}

.navBtn:active{transform:translateY(-50%) scale(0.95)}
.navBtn.left{left:8px;}
.navBtn.right{right:8px;}

@media (min-width: 640px) {
  .navBtn.left{left:14px;}
  .navBtn.right{right:14px;}
}

.pauseBtn{
  position:absolute;
  top:12px;
  right:12px;
  width:32px;
  height:32px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,0.2);
  background:rgba(0,0,0,0.5);
  backdrop-filter:blur(8px);
  color:#fff;
  cursor:pointer;
  font-size:12px;
  transition:all 0.3s ease;
  z-index:10;
}

.pauseBtn:hover{
  background:rgba(0,0,0,0.7);
  transform:scale(1.1);
}

.heroInner{
  width:100%;
  animation:fadeIn 0.3s ease;
}

.heroInner.transitioning{
  animation:slideTransition 0.3s ease;
}

@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}

@keyframes slideTransition{
  0%{opacity:1;transform:translateX(0)}
  50%{opacity:0;transform:translateX(-20px)}
  100%{opacity:1;transform:translateX(0)}
}

.heroMedia{
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:10px;
  overflow:hidden;
  background:rgba(0,0,0,0.2);
  height:220px;
  box-shadow:inset 0 2px 10px rgba(0,0,0,0.3);
}

@media (min-width: 640px) {
  .heroMedia{
    border-radius:14px;
    height:340px;
  }
}

.heroMedia img,.heroMedia video{
  width:100%;
  height:100%;
  object-fit:contain;
  background:#071424;
}

.heroMeta{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  margin-top:10px;
  color:#e2e8f0;
}

@media (min-width: 640px) {
  .heroMeta{margin-top:14px;}
}

.heroTitle{
  font-weight:800;
  font-size:14px;
}

@media (min-width: 640px) {
  .heroTitle{font-size:18px;}
}

.heroSub{
  opacity:0.8;
  font-size:11px;
  margin-top:2px;
}

@media (min-width: 640px) {
  .heroSub{font-size:12px;}
}

.heroCount{
  opacity:0.75;
  font-size:11px;
}

@media (min-width: 640px) {
  .heroCount{font-size:12px;}
}

.progress{
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:3px;
  background:rgba(255,255,255,0.1);
}

@media (min-width: 640px) {
  .progress{height:4px;}
}

.progress .bar{
  display:block;
  height:100%;
  background:linear-gradient(90deg, #10b981 0%, #06b6d4 100%);
  animation-name:grow;
  animation-timing-function:linear;
  animation-fill-mode:forwards;
  box-shadow:0 0 10px rgba(16,185,129,0.5);
}

@keyframes grow{from{width:0}to{width:100%}}

.dots{
  position:absolute;
  bottom:10px;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  gap:6px;
  z-index:10;
}

@media (min-width: 640px) {
  .dots{
    bottom:12px;
    gap:8px;
  }
}

.dot{
  width:8px;
  height:8px;
  border-radius:50%;
  border:none;
  background:rgba(255,255,255,0.4);
  cursor:pointer;
  transition:all 0.3s ease;
  padding:0;
}

@media (min-width: 640px) {
  .dot{
    width:10px;
    height:10px;
  }
}

.dot:hover{
  background:rgba(255,255,255,0.6);
  transform:scale(1.2);
}

.dot.active{
  background:rgba(16,185,129,0.9);
  width:20px;
  border-radius:5px;
}

@media (min-width: 640px) {
  .dot.active{width:24px;}
}

.lists{
  display:grid;
  grid-template-columns:1fr;
  gap:12px;
  margin-top:12px;
  width:100%;
}

@media (min-width: 640px) {
  .lists{
    gap:18px;
    margin-top:18px;
  }
}

@media (min-width: 900px) {
  .lists{grid-template-columns:1fr 1fr;}
}

.col{
  background:linear-gradient(135deg, #0b1e35 0%, #1e3a5f 100%);
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.1);
  padding:12px;
  color:#e2e8f0;
  animation:slideUp 0.5s ease;
  animation-fill-mode:both;
}

@media (min-width: 640px) {
  .col{
    border-radius:18px;
    padding:16px;
  }
}

.col:nth-child(1){animation-delay:0.1s}
.col:nth-child(2){animation-delay:0.2s}

@keyframes slideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

.colHead{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:8px;
}

@media (min-width: 640px) {
  .colHead{margin-bottom:10px;}
}

.colHead h2{
  margin:0;
  font-size:14px;
  display:flex;
  align-items:center;
  gap:6px;
}

@media (min-width: 640px) {
  .colHead h2{
    font-size:16px;
    gap:8px;
  }
}

.icon{font-size:18px;}

@media (min-width: 640px) {
  .icon{font-size:20px;}
}

.pill{
  font-size:11px;
  padding:3px 8px;
  border-radius:999px;
  background:rgba(16,185,129,0.2);
  border:1px solid rgba(16,185,129,0.3);
  color:#6ee7b7;
  font-weight:600;
}

@media (min-width: 640px) {
  .pill{
    font-size:12px;
    padding:4px 10px;
  }
}

.muted{
  opacity:0.8;
  margin:8px 0 0;
  font-size:13px;
}

@media (min-width: 640px) {
  .muted{font-size:14px;}
}

.grid{
  display:grid;
  grid-template-columns:1fr;
  gap:10px;
}

@media (min-width: 520px) {
  .grid{
    grid-template-columns:repeat(2, minmax(0,1fr));
    gap:12px;
  }
}

.card{
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.1);
  background:rgba(255,255,255,0.06);
  overflow:hidden;
  cursor:pointer;
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
  transform:translateY(-8px);
  box-shadow:0 20px 40px rgba(0,0,0,0.3);
  border-color:rgba(16,185,129,0.3);
}

.thumb{
  position:relative;
  height:140px;
  background:rgba(0,0,0,0.25);
  overflow:hidden;
}

@media (min-width: 640px) {
  .thumb{height:150px;}
}

.thumb img,.thumb video{
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform 0.5s ease;
}

.thumb img.zoomed{transform:scale(1.1);}

.noimg{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  height:100%;
  opacity:0.7;
  font-size:12px;
  gap:8px;
}

.icon-placeholder{font-size:32px;opacity:0.5;}

.badge{
  position:absolute;
  right:8px;
  top:8px;
  width:28px;
  height:28px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:rgba(15,23,42,0.85);
  backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,0.2);
  font-size:10px;
  color:#fff;
  box-shadow:0 4px 12px rgba(0,0,0,0.3);
}

@media (min-width: 640px) {
  .badge{
    right:10px;
    top:10px;
    width:30px;
    height:30px;
    font-size:12px;
  }
}

.play-icon{animation:pulse 2s ease infinite;}

@keyframes pulse{
  0%, 100%{opacity:1}
  50%{opacity:0.7}
}

.overlay{
  position:absolute;
  inset:0;
  background:linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  opacity:0;
  transition:opacity 0.3s ease;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  padding:12px;
}

.card:hover .overlay{opacity:1;}

.view-text{
  color:#fff;
  font-size:12px;
  font-weight:600;
  text-transform:uppercase;
  letter-spacing:0.5px;
}

@media (min-width: 640px) {
  .view-text{font-size:13px;}
}

.body{padding:8px 10px;}

@media (min-width: 640px) {
  .body{padding:10px 12px;}
}

.body h3{
  margin:0;
  font-size:13px;
  line-height:1.3;
}

@media (min-width: 640px) {
  .body h3{font-size:14px;}
}

.body time{
  display:flex;
  align-items:center;
  gap:4px;
  margin-top:4px;
  font-size:11px;
  opacity:0.8;
}

@media (min-width: 640px) {
  .body time{
    margin-top:6px;
    font-size:12px;
  }
}

.time-icon{font-size:12px;}

.empty{
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:12px;
  opacity:0.8;
}

.spinner{
  width:40px;
  height:40px;
  border:4px solid rgba(255,255,255,0.2);
  border-top-color:#10b981;
  border-radius:50%;
  animation:spin 1s linear infinite;
}

@keyframes spin{
  to{transform:rotate(360deg)}
}

.modal{
  position:fixed;
  inset:0;
  z-index:9999;
  background:rgba(0,0,0,0.85);
  backdrop-filter:blur(8px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:12px;
  animation:modalFadeIn 0.3s ease;
  overflow-y:auto;
}

@media (min-width: 640px) {
  .modal{padding:18px;}
}

@keyframes modalFadeIn{
  from{opacity:0}
  to{opacity:1}
}

.modalBox{
  width:min(980px, 96vw);
  max-height:90vh;
  background:linear-gradient(135deg, #0b1e35 0%, #1e3a5f 100%);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:12px;
  overflow:hidden;
  animation:modalSlideUp 0.4s ease;
  box-shadow:0 25px 60px rgba(0,0,0,0.5);
  margin:auto;
  display:flex;
  flex-direction:column;
}

@media (min-width: 640px) {
  .modalBox{border-radius:18px;}
}

@keyframes modalSlideUp{
  from{opacity:0;transform:translateY(50px) scale(0.9)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

.modalTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:10px 12px;
  border-bottom:1px solid rgba(255,255,255,0.1);
  background:rgba(0,0,0,0.2);
}

@media (min-width: 640px) {
  .modalTop{padding:12px 14px;}
}

.modalTitle{
  color:#e2e8f0;
  font-weight:800;
  font-size:14px;
}

@media (min-width: 640px) {
  .modalTitle{font-size:16px;}
}

.closeBtn{
  border:1px solid rgba(255,255,255,0.14);
  background:rgba(255,255,255,0.08);
  color:#e2e8f0;
  border-radius:8px;
  padding:5px 9px;
  cursor:pointer;
  transition:all 0.3s ease;
  font-size:14px;
}

@media (min-width: 640px) {
  .closeBtn{
    border-radius:10px;
    padding:6px 10px;
    font-size:16px;
  }
}

.closeBtn:hover{
  background:rgba(255,255,255,0.15);
  transform:rotate(90deg);
}

.modalMedia{
  height:min(60vh, 400px);
  background:#071424;
  flex-shrink:0;
}

@media (min-width: 640px) {
  .modalMedia{height:min(70vh, 560px);}
}

.modalMedia img,.modalMedia video{
  width:100%;
  height:100%;
  object-fit:contain;
}

.modalFooter{
  padding:10px 12px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  background:rgba(0,0,0,0.2);
  flex-wrap:wrap;
}

@media (min-width: 640px) {
  .modalFooter{
    padding:12px 14px;
    gap:12px;
  }
}

.modalDate{
  display:flex;
  align-items:center;
  gap:6px;
  color:#94a3b8;
  font-size:12px;
}

@media (min-width: 640px) {
  .modalDate{
    gap:8px;
    font-size:13px;
  }
}

.linkBtn{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:7px 11px;
  border-radius:10px;
  border:1px solid rgba(16,185,129,0.3);
  background:linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.2) 100%);
  color:#6ee7b7;
  text-decoration:none;
  font-size:12px;
  font-weight:600;
  transition:all 0.3s ease;
}

@media (min-width: 640px) {
  .linkBtn{
    gap:8px;
    padding:8px 12px;
    border-radius:12px;
    font-size:13px;
  }
}

.linkBtn:hover{
  background:linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(6,182,212,0.3) 100%);
  transform:translateY(-2px);
  box-shadow:0 8px 20px rgba(16,185,129,0.2);
}

.link-icon{font-size:14px;}

@media (min-width: 640px) {
  .link-icon{font-size:16px;}
}

/* Fullscreen Lightbox - Cinema Style */
.lightbox{
  position:fixed;
  inset:0;
  z-index:99999;
  background:rgba(0,0,0,0.95);
  display:flex;
  align-items:center;
  justify-content:center;
  animation:lightboxFadeIn 0.3s ease;
}

@keyframes lightboxFadeIn{
  from{opacity:0}
  to{opacity:1}
}

.lightbox-content{
  position:relative;
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:20px;
}

@media (min-width: 640px) {
  .lightbox-content{padding:40px;}
}

.lightbox-close{
  position:absolute;
  top:16px;
  right:16px;
  width:44px;
  height:44px;
  border:2px solid rgba(255,255,255,0.3);
  background:rgba(0,0,0,0.6);
  color:#fff;
  border-radius:50%;
  cursor:pointer;
  transition:all 0.3s ease;
  font-size:20px;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:10;
  backdrop-filter:blur(8px);
}

@media (min-width: 640px) {
  .lightbox-close{
    top:24px;
    right:24px;
    width:52px;
    height:52px;
    font-size:24px;
  }
}

.lightbox-close:hover{
  background:rgba(255,255,255,0.15);
  border-color:rgba(255,255,255,0.5);
  transform:rotate(90deg) scale(1.1);
}

.lightbox-media{
  max-width:100%;
  max-height:calc(100vh - 160px);
  display:flex;
  align-items:center;
  justify-content:center;
  animation:lightboxZoomIn 0.4s ease;
}

@media (min-width: 640px) {
  .lightbox-media{max-height:calc(100vh - 180px);}
}

@keyframes lightboxZoomIn{
  from{opacity:0;transform:scale(0.8)}
  to{opacity:1;transform:scale(1)}
}

.lightbox-media img{
  max-width:100%;
  max-height:calc(100vh - 160px);
  object-fit:contain;
  border-radius:8px;
  box-shadow:0 20px 60px rgba(0,0,0,0.5);
}

@media (min-width: 640px) {
  .lightbox-media img{
    max-height:calc(100vh - 180px);
    border-radius:12px;
  }
}

.lightbox-media video{
  max-width:100%;
  max-height:calc(100vh - 160px);
  border-radius:8px;
  box-shadow:0 20px 60px rgba(0,0,0,0.5);
}

@media (min-width: 640px) {
  .lightbox-media video{
    max-height:calc(100vh - 180px);
    border-radius:12px;
  }
}

.lightbox-info{
  position:absolute;
  bottom:0;
  left:0;
  right:0;
  padding:20px;
  background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%);
  animation:lightboxSlideUp 0.5s ease 0.2s both;
}

@media (min-width: 640px) {
  .lightbox-info{padding:30px 40px;}
}

@keyframes lightboxSlideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

.lightbox-title{
  color:#fff;
  font-size:18px;
  font-weight:700;
  margin:0 0 12px 0;
  text-shadow:0 2px 10px rgba(0,0,0,0.5);
}

@media (min-width: 640px) {
  .lightbox-title{
    font-size:24px;
    margin:0 0 16px 0;
  }
}

.lightbox-meta{
  display:flex;
  align-items:center;
  gap:16px;
  flex-wrap:wrap;
}

@media (min-width: 640px) {
  .lightbox-meta{gap:20px;}
}

.lightbox-date{
  display:flex;
  align-items:center;
  gap:8px;
  color:rgba(255,255,255,0.8);
  font-size:14px;
}

@media (min-width: 640px) {
  .lightbox-date{font-size:16px;}
}
`