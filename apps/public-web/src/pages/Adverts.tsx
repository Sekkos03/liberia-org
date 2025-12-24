// public-web/src/pages/Adverts.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchAdverts as loadAdverts, splitByKind, type Advert } from "../lib/adverts";
import { toPublicUrl } from "../lib/media";

const SLIDE_MS = 7000;

export default function AdvertsPage() {
  const q = useQuery({
    queryKey: ["adverts"],
    queryFn: () => loadAdverts(0, 200),
  });

  const items = useMemo(() => {
    const list = (q.data ?? []).slice();
    // hvis active finnes, filtrer på den
    const filtered = list.filter((a) => a.active !== false);
    // nyeste først
    filtered.sort((a, b) => {
      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      return db - da;
    });
    return filtered;
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
  }, [items.length]);

  useEffect(() => setIdx(0), [items.length]);

  const current = items[idx] ?? null;
  const { images, videos } = useMemo(() => splitByKind(items), [items]);

  const prev = () => items.length && setIdx((v) => (v - 1 + items.length) % items.length);
  const next = () => items.length && setIdx((v) => (v + 1) % items.length);

  return (
    <div className="adverts">
      <Navbar />

      <main className="adverts__wrap">
        <h1 className="adverts__title">Adverts</h1>

        <section className="hero">
          <button className="hero__nav hero__nav--left" onClick={prev} aria-label="Forrige">
            {"<"}
          </button>

          <div className="hero__stage">
            {q.isLoading ? (
              <div className="hero__empty">Laster…</div>
            ) : current ? (
              <Slide item={current} />
            ) : (
              <div className="hero__empty">Ingen annonser publisert.</div>
            )}
          </div>

          <button className="hero__nav hero__nav--right" onClick={next} aria-label="Neste">
            {">"}
          </button>

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
  const src = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";

  // Viktig: aldri render <img src=""> / <video src="">
  if (!src) {
    return (
      <div className="slide">
        <div className="slide__empty">Ingen media</div>
        <div className="slide__caption">{item.title}</div>
      </div>
    );
  }

  const poster = item.posterUrl ? toPublicUrl(item.posterUrl) : undefined;

  return (
    <div className="slide">
      {isVideo ? (
        <video className="slide__media" src={src} poster={poster} controls playsInline />
      ) : (
        <img className="slide__media" src={src} alt={item.title} />
      )}
      <div className="slide__caption">{item.title}</div>
    </div>
  );
}

function Card({ item }: { item: Advert }) {
  const isVideo = item.mediaType === "VIDEO";
  const media = item.mediaUrl ? toPublicUrl(item.mediaUrl) : "";
  const poster = item.posterUrl ? toPublicUrl(item.posterUrl) : undefined;
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className="card" onClick={() => setOpen(true)} role="button" tabIndex={0}>
        <div className="card__thumb">
          {media ? (
            isVideo ? (
              <video src={media} poster={poster} muted playsInline />
            ) : (
              <img src={media} alt={item.title} />
            )
          ) : (
            <div className="card__noimg">no img</div>
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
            <button className="lightbox__close" onClick={() => setOpen(false)} aria-label="Lukk">
              ✕
            </button>

            {media ? (
              isVideo ? (
                <video src={media} poster={poster} controls autoPlay />
              ) : (
                <img src={media} alt={item.title} />
              )
            ) : (
              <div className="hero__empty">Ingen media</div>
            )}

            <div className="lightbox__caption">{item.title}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* CSS (samme som før, med et par små tillegg for "no img") */
const css = `
.adverts{display:flex;flex-direction:column;min-height:100vh;}
.adverts__wrap{flex:1;width:min(1200px,94vw);margin:0 auto;padding:32px 0 56px;}
.adverts__title{font-size:44px;line-height:1.15;margin:8px 8px 24px 8px;font-weight:800;letter-spacing:-.02em}

.hero{position:relative;border-radius:20px;background:#0b1e35;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:22px 56px 18px 56px;min-height:360px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.hero__stage{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.hero__empty{color:#cbd5e1;opacity:.9;font-size:14px}
.hero__nav{position:absolute;top:50%;transform:translateY(-50%);border:0;background:#f8fafc;color:#111827;border-radius:10px;height:40px;width:40px;display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.25)}
.hero__nav--left{left:16px}
.hero__nav--right{right:16px}
.hero__nav:hover{filter:brightness(.95)}
.hero__progress{position:absolute;left:0;right:0;bottom:0;height:8px;background:rgba(255,255,255,.18)}
.hero__bar{display:block;height:100%;background:#15b2a9;animation-name:heroBar;animation-timing-function:linear}
@keyframes heroBar{from{width:0}to{width:100%}}

.slide{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.slide__media{max-width:100%;max-height:310px;border-radius:14px;box-shadow:0 12px 25px rgba(0,0,0,.25);object-fit:contain;background:#0b1a2e}
.slide__caption{color:#e5e7eb;font-weight:700}
.slide__empty{width:100%;height:310px;border-radius:14px;background:rgba(0,0,0,.15);display:grid;place-items:center;color:#cbd5e1}

.lists{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
@media (max-width:900px){.lists{grid-template-columns:1fr}}
.listCol{background:#0b1e35;border-radius:18px;padding:16px;box-shadow:0 10px 20px rgba(0,0,0,.18)}
.listCol__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.listCol__head h2{color:#e5e7eb;font-size:16px;margin:0}
.listCol__count{color:#93c5fd;background:rgba(147,197,253,.15);padding:4px 10px;border-radius:999px;font-size:12px}
.muted{color:#cbd5e1;opacity:.85;margin:10px 0 0}

.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media (max-width:1100px){.cards{grid-template-columns:repeat(2,1fr)}}
@media (max-width:560px){.cards{grid-template-columns:1fr}}
.card{cursor:pointer;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#0a1830;transition:transform .08s ease}
.card:hover{transform:translateY(-2px)}
.card__thumb{height:140px;background:rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center}
.card__thumb img,.card__thumb video{width:100%;height:100%;object-fit:cover}
.card__noimg{color:#cbd5e1;opacity:.7;font-size:12px}
.card__body{padding:10px}
.card__title{margin:0;color:#e5e7eb;font-size:14px}
.card__meta{display:block;color:#cbd5e1;opacity:.8;font-size:12px;margin-top:6px}

.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}
.lightbox__inner{position:relative;background:#0b1e35;border-radius:18px;max-width:min(980px,92vw);max-height:92vh;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.lightbox__close{position:absolute;top:10px;right:10px;border:0;background:rgba(255,255,255,.12);color:#fff;width:34px;height:34px;border-radius:10px;cursor:pointer}
.lightbox__inner img,.lightbox__inner video{display:block;max-width:100%;max-height:82vh;object-fit:contain;background:#0b162e}
.lightbox__caption{padding:10px 14px;color:#e5e7eb}
`;
