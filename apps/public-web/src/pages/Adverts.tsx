// src/pages/Adverts.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchAdverts as loadAdverts, splitByKind, type Advert } from "../lib/adverts";
import { toPublicUrl } from "../lib/media";

const SLIDE_MS = 7_000;

export default function Adverts() {
  const q = useQuery({
    queryKey: ["adverts"],
    queryFn: () => loadAdverts(),
  });

  const items = useMemo(() => {
    const list = (q.data ?? []).slice();
    list.sort((a, b) => {
      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      return db - da;
    });
    return list;
  }, [q.data]);

  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!items.length) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setIdx((v) => (v + 1) % items.length);
    }, SLIDE_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [items]);

  useEffect(() => setIdx(0), [items.length]);

  const current = items[idx];
  const { images, videos } = useMemo(() => splitByKind(items), [items]);

  return (
    <div className="adverts">
      <Navbar />

      <main className="adverts__wrap">
        <h1 className="adverts__title">Adverts</h1>

        <section className="hero">
          <div className="hero__frame">
            <button
              className="hero__ctrl"
              aria-label="Previous"
              onClick={() =>
                setIdx((v) => (v - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1))
              }
              disabled={!items.length}
            >
              &lt;
            </button>

            <div className="hero__stage">
              {q.isLoading && <div className="hero__empty">Loading…</div>}

              {!q.isLoading && q.isError && (
                <div className="hero__error" role="alert">
                  Error: {(q.error as Error)?.message ?? "Failed to fetch"}
                </div>
              )}

              {!q.isLoading && !q.isError && !items.length && (
                <div className="hero__empty">No adverts published yet.</div>
              )}

              {!q.isLoading && !q.isError && current && <Slide key={String(current.id)} item={current} />}
            </div>

            <button
              className="hero__ctrl"
              aria-label="Next"
              onClick={() => setIdx((v) => (v + 1) % Math.max(items.length, 1))}
              disabled={!items.length}
            >
              &gt;
            </button>
          </div>

          <div className="hero__dots">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to advert ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`dot ${i === idx ? "dot--active" : ""}`}
              />
            ))}
          </div>
          <div className="hero__progress">
            <span key={idx} className="hero__bar" style={{ animationDuration: `${SLIDE_MS}ms` }} />
          </div>
        </section>

        <section className="lists">
          <div className="listCol">
            <header className="listCol__head">
              <h2>Image Adverts</h2>
              <span className="listCol__count">{images.length}</span>
            </header>
            {images.length === 0 ? (
              <p className="muted">No images published.</p>
            ) : (
              <div className="cards">{images.map((a) => <Card key={String(a.id)} item={a} />)}</div>
            )}
          </div>

          <div className="listCol">
            <header className="listCol__head">
              <h2>Video Adverts</h2>
              <span className="listCol__count">{videos.length}</span>
            </header>
            {videos.length === 0 ? (
              <p className="muted">No videos published.</p>
            ) : (
              <div className="cards">{videos.map((a) => <Card key={String(a.id)} item={a} />)}</div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

function Slide({ item }: { item: Advert }) {
  const isVideo = item.mediaType === "VIDEO";
  return (
    <div className="slide">
      {isVideo ? (
        <video
          className="slide__media"
          src={toPublicUrl(item.mediaUrl)}
          poster={toPublicUrl(item.posterUrl)}
          controls
          playsInline
        />
      ) : (
        <img className="slide__media" src={toPublicUrl(item.mediaUrl)} alt={item.title} />
      )}
      <div className="slide__caption">{item.title}</div>
    </div>
  );
}

function Card({ item }: { item: Advert }) {
  const isVideo = item.mediaType === "VIDEO";
  const [open, setOpen] = useState(false);
  return (
    <>
      <article className="card" onClick={() => setOpen(true)} role="button" tabIndex={0}>
        <div className="card__thumb">
          {isVideo ? (
            <video src={toPublicUrl(item.mediaUrl)} poster={toPublicUrl(item.posterUrl)} muted playsInline />
          ) : (
            <img src={toPublicUrl(item.mediaUrl)} alt={item.title} />
          )}
        </div>
        <div className="card__body">
          <h3 className="card__title">{item.title}</h3>
          {item.createdAt && (
            <time className="card__meta" dateTime={item.createdAt}>
              {new Date(item.createdAt).toLocaleDateString()}
            </time>
          )}
        </div>
      </article>

      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox__close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            {isVideo ? (
              <video src={toPublicUrl(item.mediaUrl)} poster={toPublicUrl(item.posterUrl)} controls autoPlay />
            ) : (
              <img src={toPublicUrl(item.mediaUrl)} alt={item.title} />
            )}
            <div className="lightbox__caption">{item.title}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* CSS (uendret fra din fil) */
const css = `
/* Layout: header -> innhold -> footer */
.adverts{display:flex;flex-direction:column;min-height:100vh;}
.adverts__wrap{flex:1;width:min(1200px,94vw);margin:0 auto;padding:32px 0 56px;}
.adverts__title{font-size:42px;line-height:1.15;margin:8px 8px 24px 8px;font-weight:800;letter-spacing:.3px;}

.hero{margin:12px auto 28px;}
.hero__frame{position:relative;background:#152843;border-radius:20px;padding:28px;box-shadow:0 6px 20px rgba(12,18,32,2);}
.hero__stage{min-height:420px;display:flex;align-items:center;justify-content:center;border-radius:16px;overflow:hidden;}
.hero__empty{color:#cbd5e1;font-size:15px;}
.hero__error{background:#b91c1c;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600;}
.hero__ctrl{position:absolute;top:50%;transform:translateY(-50%);background:#e5e7eb;border:1px solid #cfd3db;color:#111827;border-radius:10px;height:40px;width:40px;display:grid;place-items:center;cursor:pointer}
.hero__ctrl[disabled]{opacity:.5;cursor:not-allowed}
.hero__ctrl:first-of-type{left:14px}
.hero__ctrl:last-of-type{right:14px}

.slide{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
.slide__media{max-width:100%;max-height:520px;object-fit:contain;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.25)}
.slide__caption{position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,.45);color:#fff;padding:6px 10px;border-radius:8px;font-size:14px;font-weight:600;backdrop-filter:blur(4px)}

.hero__dots{display:flex;gap:10px;justify-content:center;margin-top:14px;}
.dot{height:12px;width:12px;border-radius:4px;background:#294469;border:0;outline:0;cursor:pointer;transition:transform .18s ease}
.dot--active{background:#29a3a3;transform:scale(1.08)}
.hero__progress{height:3px;background:#e3e7ef;border-radius:999px;overflow:hidden;margin-top:8px}
.hero__bar{display:block;height:100%;width:100%;background:#29a3a3;animation:bar var(--d,7s) linear forwards}
@keyframes bar{from{transform:translateX(-100%)}to{transform:translateX(0)}}

.lists{display:grid;grid-template-columns:1fr;gap:24px;margin-top:24px}
@media (min-width: 980px){.lists{grid-template-columns:1fr 1fr}}
.listCol{background:#152843;border:1px solid #0f1b3a;border-radius:20px;padding:16px 18px;color:#cbd5e1;box-shadow:0 6px 20px rgba(12,18,32,0.2)}
.listCol__head{display:flex;align-items:center;gap:10px;margin:2px 4px 12px 4px}
.listCol__count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;font-size:12px;border-radius:999px;background:#223b66}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (min-width:980px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}

.card{background:#0f1b3a;border:1px solid #0a142c;border-radius:14px;overflow:hidden;cursor:pointer}
.card__thumb{height:160px;display:grid;place-items:center;background:#0b162e}
.card__thumb img,.card__thumb video{max-width:100%;max-height:100%;object-fit:contain}
.card__body{padding:12px}
.card__title{font-weight:700;color:#fff}
.card__meta{font-size:12px;opacity:.75}

.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:20px;z-index:50}
.lightbox__inner{background:#0f1b3a;border:1px solid #0a142c;border-radius:16px;box-shadow:0 10px 36px rgba(0,0,0,.4);max-width:min(1100px,94vw);max-height:min(86vh,900px);width:100%;overflow:hidden;display:flex;flex-direction:column}
.lightbox__close{align-self:flex-end;margin:8px 10px;background:#fff1;color:#fff;border:1px solid #fff3;border-radius:8px;height:34px;width:34px}
.lightbox__inner img,.lightbox__inner video{flex:1;min-height:0;width:100%;object-fit:contain;background:#0b162e}
.lightbox__caption{padding:10px 14px;color:#e5e7eb}
`;
