// public-web/src/pages/Adverts.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchAdverts as loadAdverts, splitByKind, type Advert } from "../lib/adverts";
import { toPublicUrl } from "../lib/media";

const SLIDE_IMAGE_MS = 14000;

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
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
  const timerRef = useRef<number | null>(null);

  const current = items[idx] ?? null;
  const { images, videos } = useMemo(() => splitByKind(items), [items]);

  const prev = () => items.length && setIdx((v) => (v - 1 + items.length) % items.length);
  const next = () => items.length && setIdx((v) => (v + 1) % items.length);

  useEffect(() => setIdx(0), [items.length]);

  // Slideshow: bilder på timer, video -> onEnded
  useEffect(() => {
    if (!items.length) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    if (current?.mediaType === "VIDEO") return;

    timerRef.current = window.setTimeout(() => {
      setIdx((v) => (v + 1) % items.length);
    }, SLIDE_IMAGE_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [idx, items.length, current?.mediaType]);

  return (
    <div className="adverts">
      <Navbar />

      <main className="wrap">
        <header className="pageHead">
          <h1>Adverts</h1>
        </header>

        <section className="hero">
          <button className="navBtn left" onClick={prev} aria-label="Previous" type="button">
            ‹
          </button>

          <div className="heroStage">
            {q.isLoading ? (
              <div className="empty">Loading…</div>
            ) : current ? (
              <HeroSlide item={current} idx={idx} total={items.length} onVideoEnded={next} />
            ) : (
              <div className="empty">No adverts published.</div>
            )}
          </div>

          <button className="navBtn right" onClick={next} aria-label="Next" type="button">
            ›
          </button>

          {/* Progress kun for bilder */}
          {current?.mediaType !== "VIDEO" && items.length > 1 && (
            <div className="progress">
              <span key={idx} className="bar" style={{ animationDuration: `${SLIDE_IMAGE_MS}ms` }} />
            </div>
          )}
        </section>

        <section className="lists">
          <div className="col">
            <div className="colHead">
              <h2>Image adverts</h2>
              <span className="pill">{images.length}</span>
            </div>

            {images.length === 0 ? (
              <p className="muted">No images.</p>
            ) : (
              <div className="grid">{images.map((a) => <Card key={String(a.id)} item={a} />)}</div>
            )}
          </div>

          <div className="col">
            <div className="colHead">
              <h2>Video adverts</h2>
              <span className="pill">{videos.length}</span>
            </div>

            {videos.length === 0 ? (
              <p className="muted">No videos.</p>
            ) : (
              <div className="grid">{videos.map((a) => <Card key={String(a.id)} item={a} />)}</div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

function HeroSlide({
  item,
  idx,
  total,
  onVideoEnded,
}: {
  item: Advert;
  idx: number;
  total: number;
  onVideoEnded?: () => void;
}) {
  const isVideo = item.mediaType === "VIDEO";
  const src = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";
  const poster = item.posterUrl ? toPublicUrl(item.posterUrl) : undefined;

  const published = fmtDate(item.createdAt || item.updatedAt);

  return (
    <div className="heroInner">
      <div className="heroMedia">
        {src ? (
          isVideo ? (
            <video
              key={String(item.id)}
              src={src}
              poster={poster}
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
          {published && <div className="heroSub">Published: {published}</div>}
        </div>
        <div className="heroCount">
          {total > 0 ? `${idx + 1} / ${total}` : null}
        </div>
      </div>
    </div>
  );
}

function Card({ item }: { item: Advert }) {
  const isVideo = item.mediaType === "VIDEO";
  const media = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";
  const poster = item.posterUrl ? toPublicUrl(item.posterUrl) : undefined;

  const published = fmtDate(item.createdAt || item.updatedAt);

  const [open, setOpen] = useState(false);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <article className="card" onClick={() => setOpen(true)} role="button" tabIndex={0}>
        <div className="thumb">
          {media ? (
            isVideo ? (
              <video src={media} poster={poster} muted playsInline />
            ) : (
              <img src={media} alt={item.title} />
            )
          ) : (
            <div className="noimg">No image</div>
          )}
          {isVideo && <span className="badge">▶</span>}
        </div>

        <div className="body">
          <h3>{item.title}</h3>
          {published && <time>{published}</time>}
        </div>
      </article>

      {open && (
        <div className="modal" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            {/* ✅ CLEAN TOP BAR => X alltid riktig plassert */}
            <div className="modalTop">
              <div className="modalTitle">{item.title}</div>
              <button
                className="closeBtn"
                onClick={() => setOpen(false)}
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="modalMedia">
              {media ? (
                isVideo ? (
                  <video src={media} poster={poster} controls autoPlay />
                ) : (
                  <img src={media} alt={item.title} />
                )
              ) : (
                <div className="empty">No media</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const css = `
.adverts{
  min-height:100vh;
  background:
    radial-gradient(1000px 600px at 20% 0%, rgba(21,178,169,.12), transparent 60%),
    radial-gradient(900px 520px at 80% 10%, rgba(147,197,253,.14), transparent 60%),
    #fff;
}

.wrap{width:min(1200px,94vw);margin:0 auto;padding:28px 0 56px;}
.pageHead{margin:8px 8px 18px 8px;}
.pageHead h1{margin:0;font-size:44px;letter-spacing:-.02em;font-weight:900}
.pageHead p{margin:6px 0 0;color:#334155}

.hero{
  position:relative;
  background:#0b1e35;
  border-radius:18px;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 18px 40px rgba(0,0,0,.18);
  padding:18px 52px 28px 52px;
  min-height:420px;
  overflow:hidden;
}
.heroStage{display:flex;align-items:center;justify-content:center;height:100%}
.navBtn{
  position:absolute;top:50%;transform:translateY(-50%);
  width:42px;height:42px;border-radius:12px;
  border:0;background:rgba(255,255,255,.92);
  box-shadow:0 10px 20px rgba(0,0,0,.25);
  cursor:pointer;font-size:26px;line-height:0;
}
.navBtn:hover{filter:brightness(.97)}
.navBtn.left{left:14px}
.navBtn.right{right:14px}

.heroInner{width:100%;}
.heroMedia{
  display:flex;align-items:center;justify-content:center;
  height:330px;
  border-radius:14px;
  background:rgba(255,255,255,.06);
  overflow:hidden;
}
.heroMedia img,.heroMedia video{
  width:100%;height:100%;
  object-fit:contain;
  background:#0b162e;
}
.heroMeta{
  display:flex;justify-content:space-between;align-items:flex-end;
  padding:12px 4px 0 4px;
}
.heroTitle{color:#e5e7eb;font-weight:900;letter-spacing:-.01em}
.heroSub{color:#cbd5e1;opacity:.9;font-size:12px;margin-top:3px}
.heroCount{color:#cbd5e1;opacity:.9;font-size:12px}

.progress{position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(255,255,255,.18)}
.bar{display:block;height:100%;background:#15b2a9;animation-name:bar;animation-timing-function:linear}
@keyframes bar{from{width:0}to{width:100%}}

.lists{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
@media (max-width:900px){.lists{grid-template-columns:1fr}.hero{padding:18px 52px 28px 52px}}
.col{
  background:#0b1e35;
  border-radius:18px;
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 12px 26px rgba(0,0,0,.14);
  padding:16px;
}
.colHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.colHead h2{margin:0;color:#e5e7eb;font-size:16px}
.pill{background:rgba(147,197,253,.15);color:#93c5fd;padding:4px 10px;border-radius:999px;font-size:12px}
.muted{color:#cbd5e1;opacity:.85;margin:10px 0 0}

.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media (max-width:1100px){.grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:560px){.grid{grid-template-columns:1fr}}

.card{
  background:linear-gradient(180deg,#0a1830,#081326);
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;overflow:hidden;
  cursor:pointer;
  transition:transform .10s ease, box-shadow .12s ease;
}
.card:hover{transform:translateY(-2px);box-shadow:0 14px 24px rgba(0,0,0,.20)}
.thumb{position:relative;height:140px;background:rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center}
.thumb img,.thumb video{width:100%;height:100%;object-fit:cover}
.noimg{color:#cbd5e1;opacity:.75;font-size:12px}
.badge{
  position:absolute;right:10px;bottom:10px;
  background:rgba(0,0,0,.55);color:#fff;
  padding:2px 8px;border-radius:999px;font-size:12px;font-weight:800;
}
.body{padding:10px}
.body h3{margin:0;color:#e5e7eb;font-size:14px;font-weight:900}
.body time{display:block;margin-top:6px;color:#cbd5e1;opacity:.85;font-size:12px}

.empty{color:#cbd5e1;opacity:.9;font-size:14px}

/* ✅ Modal clean + X riktig */
.modal{
  position:fixed;inset:0;
  background:rgba(0,0,0,.55);
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  z-index:9999;
}
.modalBox{
  width:min(820px,94vw);
  background:#0b1e35;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 20px 50px rgba(0,0,0,.30);
  overflow:hidden;
}
.modalTop{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px;
  border-bottom:1px solid rgba(255,255,255,.10);
  background:rgba(255,255,255,.04);
}
.modalTitle{
  color:#e5e7eb;font-weight:900;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  padding-right:10px;
}
.closeBtn{
  width:40px;height:40px;border-radius:12px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.08);
  color:#fff;
  cursor:pointer;
  display:grid;place-items:center;
}
.closeBtn:hover{filter:brightness(1.06)}
.modalMedia{
  background:#0b162e;
  display:flex;align-items:center;justify-content:center;
  max-height:78vh;
}
.modalMedia img,.modalMedia video{
  width:100%;
  max-height:78vh;
  object-fit:contain;
  display:block;
}
`;
