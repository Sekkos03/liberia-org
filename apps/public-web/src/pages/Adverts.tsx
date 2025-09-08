// src/pages/Adverts.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchAdverts as loadAdverts, splitByKind, type Advert } from "../lib/adverts";

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
              aria-label="Forrige"
              onClick={() =>
                setIdx((v) => (v - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1))
              }
              disabled={!items.length}
            >
              &lt;
            </button>

            <div className="hero__stage">
              {q.isLoading && <div className="hero__empty">Laster…</div>}

              {!q.isLoading && q.isError && (
                <div className="hero__error" role="alert">
                  Feil: {(q.error as Error)?.message ?? "Failed to fetch"}
                </div>
              )}

              {!q.isLoading && !q.isError && !items.length && (
                <div className="hero__empty">Ingen annonser publisert enda.</div>
              )}

              {!q.isLoading && !q.isError && current && <Slide key={String(current.id)} item={current} />}
            </div>

            <button
              className="hero__ctrl"
              aria-label="Neste"
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
                aria-label={`Gå til annonse ${i + 1}`}
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
              <h2>Bildeannonser</h2>
              <span className="listCol__count">{images.length}</span>
            </header>
            {images.length === 0 ? (
              <p className="muted">Ingen bilder publisert.</p>
            ) : (
              <div className="cards">{images.map((a) => <Card key={String(a.id)} item={a} />)}</div>
            )}
          </div>

          <div className="listCol">
            <header className="listCol__head">
              <h2>Videoannonser</h2>
              <span className="listCol__count">{videos.length}</span>
            </header>
            {videos.length === 0 ? (
              <p className="muted">Ingen videoer publisert.</p>
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
        <video className="slide__media" src={item.mediaUrl} poster={item.posterUrl} controls playsInline />
      ) : (
        <img className="slide__media" src={item.mediaUrl} alt={item.title} />
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
            <video src={item.mediaUrl} poster={item.posterUrl} muted playsInline />
          ) : (
            <img src={item.mediaUrl} alt={item.title} />
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
            <button className="lightbox__close" onClick={() => setOpen(false)} aria-label="Lukk">✕</button>
            {isVideo ? (
              <video src={item.mediaUrl} poster={item.posterUrl} controls autoPlay />
            ) : (
              <img src={item.mediaUrl} alt={item.title} />
            )}
            <div className="lightbox__caption">{item.title}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* CSS fra deg (uendret) */
const css = `
/* Layout: header -> innhold -> footer */
.adverts{display:flex;flex-direction:column;min-height:100vh;}
.adverts__wrap{flex:1;width:min(1200px,94vw);margin:0 auto;padding:32px 0 56px;}
.adverts__title{font-size:42px;line-height:1.15;margin:8px 8px 24px 8px;font-weight:800;letter-spacing:.3px;}

.hero{margin:12px auto 28px;}
.hero__frame{position:relative;background:#152843;border-radius:20px;padding:28px;box-shadow:0 6px 20px rgba(12,18,32,.2);}
.hero__stage{min-height:420px;display:flex;align-items:center;justify-content:center;border-radius:16px;overflow:hidden;}
.hero__empty{color:#cbd5e1;font-size:15px;}
.hero__error{background:#b91c1c;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600;}
.hero__ctrl{position:absolute;top:50%;transform:translateY(-50%);background:#e5e7eb;border:1px solid #cfd3db;color:#111827;border-radius:10px;height:40px;width:40px;display:grid;place-items:center;cursor:pointer}
.hero__ctrl[disabled]{opacity:.5;cursor:not-allowed}
.hero__ctrl:first-of-type{left:14px}
.hero__ctrl:last-of-type{right:14px}

.slide{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
.slide__media{max-width:100%;max-height:520px;object-fit:contain;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.slide__caption{position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,.45);color:#fff;padding:6px 10px;border-radius:8px;font-size:14px;font-weight:600;backdrop-filter:blur(4px)}

.hero__dots{display:flex;gap:10px;justify-content:center;margin-top:14px;}
.dot{height:12px;width:12px;border-radius:4px;background:#294469;border:0;outline:0;cursor:pointer;transition:transform .18s ease}
.dot--active{background:#29a3a3;transform:scale(1.08)}
.hero__progress{height:3px;background:#e3e7ef;border-radius:999px;overflow:hidden;margin-top:8px}
.hero__bar{display:block;height:100%;width:100%;background:#29a3a3;animation:progress linear forwards}
@keyframes progress{from{transform:translateX(-100%)}to{transform:translateX(0)}}

.lists{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:34px}
@media (max-width: 960px){.lists{grid-template-columns:1fr}}

.listCol{background:#0f2139;border:1px solid #223a58;border-radius:18px;padding:18px 16px 20px;box-shadow:0 6px 18px rgba(13,26,46,.12)}
.listCol__head{display:flex;align-items:center;gap:10px;margin:0 6px 12px}
.listCol h2{font-size:22px;font-weight:800;color:#e7eef9;margin:0}
.listCol__count{background:#1e3a5f;color:#cde3ff;border:1px solid #37537a;padding:2px 8px;border-radius:999px;font-size:12px}

.muted{color:#9fb2cc;margin:8px}

.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
@media (max-width: 1100px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width: 640px){.cards{grid-template-columns:1fr}}

.card{background:#10233c;border:1px solid #294567;border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 6px 18px rgba(13,26,46,.12);transition:transform .18s ease, box-shadow .18s ease}
.card:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(13,26,46,.16)}
.card__thumb{aspect-ratio:16/9;background:#0b1a2d;display:grid;place-items:center;overflow:hidden}
.card__thumb img,.card__thumb video{width:100%;height:100%;object-fit:cover}
.card__body{padding:10px 12px 12px}
.card__title{font-size:15px;color:#e6eefc;margin:0 0 4px;line-height:1.3}
.card__meta{font-size:12px;color:#9fb2cc}

/* Lightbox */
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:60}
.lightbox__inner{background:#0c1728;border:1px solid #254161;border-radius:16px;padding:14px;max-width:min(92vw,1100px)}
.lightbox__inner img,.lightbox__inner video{max-width:calc(92vw - 28px);max-height:calc(86vh - 72px);border-radius:10px}
.lightbox__caption{color:#e6eefc;margin-top:8px;font-weight:600}
.lightbox__close{position:absolute;top:14px;right:14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;height:36px;width:36px;cursor:pointer}
`;
