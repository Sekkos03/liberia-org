import { useMemo, useState } from "react";
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
  const [lightbox, setLightbox] = useState<{ url: string; title?: string | null } | null>(null);



  return (
    <div className="album">
      <Navbar />
      <main className="album__wrap">
        {/* HERO */}
        <section className="hero" aria-label="Album hero">
          <div className="hero__frame">
            <div className="hero__stage">
              {q.isError && <div className="hero__error">Feil: {(q.error as Error)?.message || "ukjent feil"}</div>}
              {q.isLoading && <div className="hero__empty">Laster album…</div>}
              {!q.isLoading && !q.isError && (
                <div className="hero__title">{title}</div>
              )}
            </div>
          </div>
        </section>

        {/* LISTER */}
        {!q.isLoading && !q.isError && (
          <div className="lists">
            {/* BILDER */}
            <div className="listCol">
              <div className="listCol__head">
                <h2>Bilder</h2>
                <span className="listCol__count">{images.length}</span>
              </div>
              {images.length === 0 ? (
                <p className="muted">Ingen bilder publisert.</p>
              ) : (
                <ul className="cards">
                  {images.map((it, idx) => (
                    <li key={(it.id ?? idx) + "-img"} className="card" onClick={() => setLightbox({ url: it.url, title: it.title })}>
                        <div className="card__thumb">
                          {(() => {
                            const full = toPublicUrl(stripStoredFileToString(it.url));
                            const thumb = it.thumbUrl
                              ? toPublicUrl(stripStoredFileToString(it.thumbUrl))
                              : full;

                            return (
                              <img
                                src={thumb}
                                alt={it.title ?? "image"}
                                loading="lazy"
                                onError={(e) => {
                                  // Hvis thumb feiler (404 osv.), fall tilbake til originalen.
                                  if (e.currentTarget.src !== full) e.currentTarget.src = full;
                                }}
                              />
                            );
                          })()}
                        </div>
                      <div className="card__body">
                        <div className="card__title">{it.title ?? " "}</div>
                        <div className="card__meta">{(q.data?.album?.title ?? "")}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* VIDEOER */}
            <div className="listCol">
              <div className="listCol__head">
                <h2>Videoer</h2>
                <span className="listCol__count">{videos.length}</span>
              </div>
              {videos.length === 0 ? (
                <p className="muted">Ingen videoer publisert.</p>
              ) : (
                <ul className="cards">
                  {videos.map((it, idx) => (
                    <li key={(it.id ?? idx) + "-vid"} className="card" onClick={() => setLightbox({ url: it.url, title: it.title })}>
                      <div className="card__thumb">
                        <video src={toPublicUrl(it.url)} preload="metadata" muted playsInline />
                      </div>
                      <div className="card__body">
                        <div className="card__title">{it.title ?? " "}</div>
                        <div className="card__meta">{(q.data?.album?.title ?? "")}</div>
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
            <button className="lightbox__close" onClick={() => setLightbox(null)} aria-label="Lukk">✕</button>
            {/\.(mp4|webm|ogg|mkv|mov)$/i.test(lightbox.url) ? (
              <video src={toPublicUrl(lightbox.url)} controls autoPlay />
            ) : (
              <img src={toPublicUrl(lightbox.url)} alt={lightbox.title ?? ""} />
            )}
            <div className="lightbox__caption">{lightbox.title ?? ""}</div>
          </div>
        </div>
      )}
      <style>{css}</style>
    </div>
  );
}

/* ---------------- STIL (gjenbruker navystil fra galleriet) ---------------- */
const css = `
.album{display:flex;flex-direction:column;min-height:100vh;background:#fff;}
.album__wrap{flex:1;width:min(1200px,94vw);margin:0 auto;padding:28px 0 56px;}

.hero{margin:12px auto 28px;}
.hero__frame{position:relative;background:#152843;border-radius:20px;padding:28px;box-shadow:0 6px 20px rgba(12,18,32,.2);}
.hero__stage{min-height:120px;display:flex;align-items:center;justify-content:center;border-radius:16px;overflow:hidden;color:#e6eef9;font-weight:800;font-size:22px}
.hero__empty{color:#cbd5e1;font-size:15px;}
.hero__error{background:#b91c1c;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600;}
.hero__title{background:#fff;color:#0f1d37;border:2px solid #0e1f3b;border-radius:10px;padding:10px 14px;box-shadow:0 6px 18px rgba(12,18,32,.18)}

.lists{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:10px}
@media (max-width: 960px){.lists{grid-template-columns:1fr}}

.listCol{background:#0f2139;border:1px solid #223a58;border-radius:18px;padding:18px 16px 20px;box-shadow:0 6px 18px rgba(13,26,46,.12)}
.listCol__head{display:flex;align-items:center;gap:10px;margin:0 6px 12px}
.listCol h2{font-size:20px;font-weight:800;color:#e7eef9;margin:0}
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

.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:60}
.lightbox__inner{background:#0c1728;border:1px solid #254161;border-radius:16px;padding:14px;max-width:min(92vw,1100px)}
.lightbox__inner img,.lightbox__inner video{max-width:calc(92vw - 28px);max-height:calc(86vh - 72px);border-radius:10px}
.lightbox__caption{color:#e6eefc;margin-top:8px;font-weight:600}
.lightbox__close{position:absolute;top:14px;right:14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;height:36px;width:36px;cursor:pointer}

.backLink{display:inline-block;margin-top:8px;color:#1e2f53;font-weight:700;text-decoration:none}
.backLink:hover{text-decoration:underline}
`;
