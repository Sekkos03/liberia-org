// public-web/src/pages/Photos.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listPublicAlbums, type PublicAlbum } from "../lib/albums";

export default function Photos() {
  const q = useQuery({
    queryKey: ["pubAlbums"],
    queryFn: () => listPublicAlbums(),
  });

  // Normaliser respons til en liste
  const items: PublicAlbum[] = Array.isArray(q.data)
    ? q.data
    : (q.data as any)?.content ?? (q.data as any)?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl bg-indigo-900/60 border border-white/10 h-40 grid place-items-center text-white/80">
        Photo of something
      </div>

      <div className="rounded-xl border border-white/10 p-6 text-center text-2xl font-semibold">
        PHOTOS AND VIDEOS GALLERY
      </div>

      {q.isLoading && <div>Laster…</div>}
      {q.isError && (
        <div className="text-red-500">Feil: {(q.error as Error).message}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {items.map((a, idx) => (
          <Link
            key={a.slug}
            to={`/photos/${a.slug}`}
            className="group rounded-xl border border-white/10 p-4 hover:bg-white/5 transition"
          >
            <div className="w-full aspect-[4/3] rounded-lg border border-white/10 overflow-hidden grid place-items-center bg-black/30">
              {a.coverUrl ? (
                <img
                  src={a.coverUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <span className="text-sm opacity-60">Album</span>
              )}
            </div>
            <div className="mt-3 font-semibold">Event {idx + 1}</div>
            <div className="text-sm opacity-70">{a.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
