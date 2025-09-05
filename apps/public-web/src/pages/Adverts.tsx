import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPublicAdverts, type PublicAdvert } from "../lib/adverts";

export default function Adverts() {
  const q = useQuery({ queryKey: ["publicAdverts"], queryFn: listPublicAdverts });

  const items = q.data ?? [];
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<PublicAdvert | null>(null);

  // auto-advance every 5s
  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  // keyboard support in lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const current = items[idx];
  const hasItems = items.length > 0;

  function next() { setIdx((i) => (i + 1) % Math.max(items.length, 1)); }
  function prev() { setIdx((i) => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1)); }

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-500">Feil: {(q.error as Error).message}</div>;
  if (!hasItems) return <div>Ingen annonser akkurat nå.</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <h1 className="text-4xl font-extrabold">Adverts</h1>

      {/* slideshow */}
      <div className="relative rounded-2xl border border-white/15 bg-[#162648] text-white">
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 px-3 py-1 hover:bg-white/10"
          aria-label="Forrige"
        >
          ‹
        </button>

        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 px-3 py-1 hover:bg-white/10"
          aria-label="Neste"
        >
          ›
        </button>

        <div className="aspect-[16/9] grid place-items-center p-4 cursor-zoom-in" onClick={() => setLightbox(current)}>
          {/* image */}
          <img
            src={current.imageUrl}
            alt={current.title}
            className="max-h-[65vh] w-auto rounded-xl object-contain shadow-lg"
            loading="lazy"
          />
        </div>

        {/* title & optional link */}
        <div className="flex items-center justify-between p-3 border-t border-white/10">
          <div className="font-semibold">{current.title}</div>
          {current.targetUrl && (
            <a
              href={current.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-2 hover:opacity-80"
            >
              Åpne lenke
            </a>
          )}
        </div>

        {/* dots */}
        <div className="flex items-center justify-center gap-2 p-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Gå til nr. ${i + 1}`}
              className={`h-2 w-2 rounded-full ${i === idx ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      </div>

      {/* lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.imageUrl} alt={lightbox.title} className="w-full h-auto rounded-xl object-contain" />
            <div className="mt-2 flex items-center justify-between">
              <div className="font-semibold text-white">{lightbox.title}</div>
              <div className="flex gap-2">
                <button onClick={prev} className="rounded-lg border border-white/30 px-3 py-1 text-white">‹</button>
                <button onClick={next} className="rounded-lg border border-white/30 px-3 py-1 text-white">›</button>
                <button onClick={() => setLightbox(null)} className="rounded-lg border border-white/30 px-3 py-1 text-white">
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
