// public-web/src/pages/Album.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getPublicAlbum } from "../lib/albums";

export default function Album() {
  const { slug = "" } = useParams();
  const q = useQuery({ queryKey: ["pubAlbum", slug], queryFn: () => getPublicAlbum(slug), enabled: !!slug });

  if (q.isLoading) return <div className="p-6">Laster…</div>;
  if (q.isError) return <div className="p-6 text-red-500">Feil: {(q.error as Error).message}</div>;
  if (!q.data) return null;

  const { album, photos } = q.data;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{album.title}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10">
            <img src={p.url} className="w-full h-40 object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}
