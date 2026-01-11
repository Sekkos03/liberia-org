import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAlbumAdmin,
  listAlbumItemsAdmin,
  uploadAlbumItemsAdmin,
  deleteAlbumItemAdmin,
  type AdminAlbumItemDTO,
} from "../../lib/albums";
// + legg til import
import { pickImageSrc, toPublicUrl, isVideo } from "../../lib/media";


const card = "rounded-xl border border-white/10 bg-[rgba(10,18,36,.65)] p-4 shadow-sm";
const btn  = "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold border";
const btnPrimary = btn + " bg-indigo-600/95 text-white border-indigo-500 hover:bg-indigo-600";
const btnGhost   = btn + " bg-transparent text-white/90 border-white/15 hover:bg-white/5";
const btnDanger  = btn + " bg-red-600/90 text-white border-red-600/70 hover:bg-red-600";

export default function AdminAlbumDetail() {
  const { id = "" } = useParams();
  const albumId = Number(id);
  const qc = useQueryClient();

  const metaQ = useQuery({
    queryKey: ["adminAlbum.meta", albumId],
    queryFn: () => getAlbumAdmin(albumId),
    enabled: Number.isFinite(albumId),
  });

  const itemsQ = useQuery({
    queryKey: ["adminAlbum.items", albumId],
    queryFn: () => listAlbumItemsAdmin(albumId),
    enabled: Number.isFinite(albumId),
  });

  const items = itemsQ.data ?? [];
  const images = useMemo(() => items.filter((x) => x.kind === "IMAGE"), [items]);
  const videos = useMemo(() => items.filter((x) => x.kind === "VIDEO"), [items]);

  const [preview, setPreview] = useState<AdminAlbumItemDTO | null>(null);

  const mUpload = useMutation({
    mutationFn: (files: File[]) => uploadAlbumItemsAdmin(albumId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbum.items", albumId] }),
  });

  const mDelete = useMutation({
    mutationFn: (itemId: number) => deleteAlbumItemAdmin(albumId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbum.items", albumId] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{metaQ.data?.title ?? "Album"}</h1>
          <div className="text-white/70">@{metaQ.data?.slug}</div>
        </div>
        <Link to="/albums" className={btnGhost}>← Tilbake</Link>
      </div>

      {/* Upload */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Last opp media</h2>
          <label className={btnPrimary + " cursor-pointer"}>
            Velg filer
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) mUpload.mutate(files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        {mUpload.isPending && <div className="text-sm text-white/70 mt-2">Laster opp…</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bilder */}
        <div className={card}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Bilder</h3>
            <span className="text-sm text-white/70">{images.length}</span>
          </div>
          {itemsQ.isLoading ? (
            <div>Laster…</div>
          ) : images.length === 0 ? (
            <div className="text-white/70">Ingen bilder.</div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((it) => (
                <li key={it.id} className="group relative">
                  <button
                    className="block w-full aspect-[16/9] overflow-hidden rounded-lg border border-white/10"
                    onClick={() => setPreview(it)}
                    title={it.title ?? ""}
                  >
                    <img
                      src={pickImageSrc(it.thumbUrl ?? null, it.url)}
                      alt={it.title ?? ""}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    className={
                      "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition " +
                      btnDanger + " px-2 py-1 text-xs"
                    }
                    onClick={() => {
                      if (confirm("Slette dette bildet?")) mDelete.mutate(it.id);
                    }}
                  >
                    Slett
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Videoer */}
        <div className={card}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Videoer</h3>
            <span className="text-sm text-white/70">{videos.length}</span>
          </div>
          {itemsQ.isLoading ? (
            <div>Laster…</div>
          ) : videos.length === 0 ? (
            <div className="text-white/70">Ingen videoer.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videos.map((it) => (
                <li key={it.id} className="group relative">
                  <button
                    className="block w-full aspect-[16/9] overflow-hidden rounded-lg border border-white/10"
                    onClick={() => setPreview(it)}
                    title={it.title ?? ""}
                  >
                    <video src={toPublicUrl(it.url)} className="w-full h-full object-cover" />
                  </button>
                  <button
                    className={
                      "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition " +
                      btnDanger + " px-2 py-1 text-xs"
                    }
                    onClick={() => {
                      if (confirm("Slette denne videoen?")) mDelete.mutate(it.id);
                    }}
                  >
                    Slett
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-[#0c1728] border border-white/15 rounded-xl p-3 max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {(preview.kind === "VIDEO" || isVideo(preview.url)) ? (
  <video
    src={toPublicUrl(preview.url)}
    controls
    autoPlay
    className="max-h-[78vh] max-w-[86vw] rounded-lg"
  />
) : (
  <img
    src={toPublicUrl(preview.url)}
    alt={preview.title ?? ""}
    className="max-h-[78vh] max-w-[86vw] rounded-lg"
  />
)}

          </div>
        </div>
      )}
    </div>
  );
}
