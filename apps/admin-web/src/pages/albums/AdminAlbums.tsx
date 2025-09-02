// admin-web/src/pages/albums/AdminAlbums.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  listAdminAlbums,
  createAlbum,
  uploadPhotos,
  setAlbumPublished,
  deleteAlbum,
  setCoverPhoto,
  getAdminAlbum,
  type AlbumDTO,
  type AlbumUpsert,
  type PhotoDTO,
} from "../../lib/albums";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminAlbums() {
  const qc = useQueryClient();

  const qAlbums = useQuery({
    queryKey: ["adminAlbums", 0],
    queryFn: () => listAdminAlbums(0, 50),
  });


  const mUpload = useMutation({
    mutationFn: ({ albumId, files }: { albumId: number; files: File[] }) => uploadPhotos(albumId, files),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["adminAlbums"] });
      qc.invalidateQueries({ queryKey: ["adminAlbum", v.albumId] });
    },
  });

  const mPublish = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => setAlbumPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  const mDelete = useMutation({
    mutationFn: (id: number) => deleteAlbum(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  // --------- UI state
  const [showNew, setShowNew] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumDTO | null>(null);

  if (qAlbums.isLoading) return <div>Laster…</div>;
  if (qAlbums.isError) return <div className="text-red-500">Feil: {(qAlbums.error as Error).message}</div>;

  const items = qAlbums.data?.content ?? [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Album (Admin)</h1>
        <button onClick={() => setShowNew(true)} className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5">
          Nytt album
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {a.coverUrl ? (
                  <img src={a.coverUrl} className="w-16 h-16 object-cover rounded-md border border-white/10" />
                ) : (
                  <div className="w-16 h-16 rounded-md border border-white/10 grid place-items-center text-xs opacity-60">
                    Ingen cover
                  </div>
                )}
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm opacity-70">{a.slug}</div>
                  <div className="text-xs opacity-60">{a.photoCount} bilder</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5 cursor-pointer">
                  Last opp
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files ?? []);
                      if (files.length) mUpload.mutate({ albumId: a.id, files });
                      e.currentTarget.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setSelectedAlbum(a)}
                  className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                >
                  Bilder
                </button>

                <button
                  onClick={() => mPublish.mutate({ id: a.id, value: !a.published })}
                  className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                  disabled={mPublish.isPending}
                  title={a.published ? "Avpubliser" : "Publiser"}
                >
                  {a.published ? "Publisert" : "Upublisert"}
                </button>

                <button
                  onClick={() => confirm("Slette album? Dette fjerner også bilder.") && mDelete.mutate(a.id)}
                  className="rounded-lg px-3 py-1 border border-red-400/30 text-red-300 hover:bg-red-400/10"
                >
                  Slett
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {selectedAlbum && (
        <AlbumPhotosModal
          albumId={selectedAlbum.id}
          title={selectedAlbum.title}
          onClose={() => setSelectedAlbum(null)}
          onSetCover={(photoId) => setCoverPhoto(selectedAlbum.id, photoId).then(() => qc.invalidateQueries({
            queryKey: ["adminAlbums"],
          }))}
        />
      )}
    </div>
  );
}

// -------- Modal: create album + optional event link
function NewAlbumModal({
  events,
  onClose,
  onCreate,
  busy,
}: {
  events: { id: number; label: string }[];
  onClose: () => void;
  onCreate: (p: { album: AlbumUpsert; eventId: number | null }) => void;
  busy?: boolean;
}) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [eventId, setEventId] = useState<number | "">("");

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-900 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Nytt album</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-lg border border-white/15 hover:bg-white/5">Lukk</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-sm opacity-80">Slug *</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm opacity-80">Tittel *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2" />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm opacity-80">Beskrivelse</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2" />
          </label>

          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>Publisert</span>
          </label>

          <label className="block space-y-1">
            <span className="text-sm opacity-80">Knytt til event (valgfritt)</span>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2"
            >
              <option value="">— Ingen —</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 border border-white/15">Avbryt</button>
          <button
            disabled={busy || !slug || !title}
            onClick={() => onCreate({ album: { slug, title, description, published }, eventId: eventId ? Number(eventId) : null })}
            className="rounded-lg px-4 py-2 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
          >
            {busy ? "Oppretter…" : "Opprett"}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------- Modal: manage photos
function AlbumPhotosModal({
  albumId,
  title,
  onClose,
  onSetCover,
}: {
  albumId: number;
  title: string;
  onClose: () => void;
  onSetCover: (photoId: number) => Promise<void>;
}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminAlbum", albumId],
    queryFn: () => getAdminAlbum(albumId),
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();

  const mDeletePhoto = useMutation({
    mutationFn: async (photoId: number) => {
      const { deletePhoto } = await import("../../lib/albums"); // lazy import to avoid circular
      return deletePhoto(albumId, photoId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminAlbum", albumId] });
      qc.invalidateQueries({ queryKey: ["adminAlbums"] });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50">
      <div className="w-full max-w-5xl rounded-2xl bg-zinc-900 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Bilder – {title}</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-lg border border-white/15 hover:bg-white/5">Lukk</button>
        </div>

        <div className="flex items-center justify-between">
          <label className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5 cursor-pointer">
            Last opp bilder
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.currentTarget.files ?? []);
                if (!files.length) return;
                const { uploadPhotos } = await import("../../lib/albums");
                await uploadPhotos(albumId, files);
                e.currentTarget.value = "";
                await refetch();
              }}
            />
          </label>
          <div className="text-sm opacity-70">{data?.photos.length ?? 0} bilder</div>
        </div>

        {isLoading ? (
          <div>Laster…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data?.photos.map((p) => (
              <figure key={p.id} className="rounded-lg overflow-hidden border border-white/10">
                <img src={p.url} className="w-full h-36 object-cover" />
                <figcaption className="flex items-center justify-between px-2 py-1 text-xs bg-black/30">
                  <button
                    className="px-2 py-1 rounded border border-white/15 hover:bg-white/5"
                    onClick={() => onSetCover(p.id).then(() => refetch())}
                  >
                    Sett som cover
                  </button>
                  <button
                    className="px-2 py-1 rounded border border-red-400/30 text-red-300 hover:bg-red-400/10"
                    onClick={() => confirm("Slette bilde?") && mDeletePhoto.mutate(p.id)}
                  >
                    Slett
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
