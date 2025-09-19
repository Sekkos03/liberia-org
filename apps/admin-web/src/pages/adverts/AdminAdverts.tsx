import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminAdverts,
  createAdvert,
  updateAdvert,
  deleteAdvert,
  setAdvertPublished,
  type AdvertDTO,
  type AdvertUpsert,
} from "../../lib/advert";
import { useState } from "react";
import { toPublicUrl } from "../../lib/media";

export default function AdminAdverts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdvertDTO | null>(null);

  const q = useQuery({
    queryKey: ["adminAdverts", 0],
    queryFn: () => listAdminAdverts(0, 50),
  });

  const mCreate = useMutation({
    mutationFn: (p: AdvertUpsert) => createAdvert(p),
    onSuccess: () => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["adminAdverts"] });
    },
  });

  const mUpdate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdvertUpsert }) => updateAdvert(id, data),
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["adminAdverts"] });
    },
  });

  const mDelete = useMutation({
    mutationFn: (id: number) => deleteAdvert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAdverts"] }),
  });

  const mPublish = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => setAdvertPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAdverts"] }),
  });

  function togglePublished(a: AdvertDTO) {
    mPublish.mutate({ id: a.id, value: !a.active });
  }

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-500">Feil: {(q.error as Error).message}</div>;

  const items = q.data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-5xl font-extrabold">Adverts (Admin)</h1>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="rounded-lg bg-white/5 px-4 py-2 hover:bg-white/10 border border-white/15"
        >
          Ny annonse
        </button>
      </div>

      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-4">
              {a.videoUrl ? (
                <video
                  src={toPublicUrl(a.videoUrl)}
                  className="h-12 w-16 object-cover rounded-md border border-white/10"
                  muted
                  loop
                  playsInline
                />
              ) : a.imageUrl ? (
                <img
                  src={toPublicUrl(a.imageUrl)}
                  alt={a.title}
                  className="h-12 w-16 object-cover rounded-md border border-white/10"
                />
              ) : (
                <div className="h-12 w-16 rounded-md border border-white/10 grid place-items-center text-xs opacity-60">no img</div>
              )}
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {a.title}
                  {a.videoUrl && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/30 border border-indigo-400/30 text-indigo-200">Video</span>}
                </div>
                {a.targetUrl && <div className="text-xs opacity-70 break-all">{a.targetUrl}</div>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-sm rounded-md border ${
                  a.active
                    ? "border-emerald-600/30 bg-emerald-900/30 text-emerald-300"
                    : "border-red-600/30 bg-red-900/30 text-red-300"
                }`}
              >
                {a.active ? "Publisert" : "Skjult"}
              </span>

              <button
                onClick={() => togglePublished(a)}
                disabled={mPublish.isPending}
                className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                title={a.active ? "Deaktiver" : "Aktiver"}
              >
                {a.active ? "Unpublish" : "Publish"}
              </button>

              <button
                onClick={() => { setEditing(a); setOpen(true); }}
                className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
              >
                Rediger
              </button>

              <button
                onClick={() => {
                  if (confirm(`Slette annonse "${a.title}"?`)) mDelete.mutate(a.id);
                }}
                className="rounded-lg px-3 py-1 border border-red-500/30 text-red-300 hover:bg-red-500/10"
              >
                Slett
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <AdvertModal
          initial={editing ?? undefined}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={(data) => {
            const payload: AdvertUpsert = {
              title: data.title,
              targetUrl: data.targetUrl,
              startAt: data.startAt,
              endAt: data.endAt,
              imageFile: data.imageFile ?? null,
              videoFile: data.videoFile ?? null,
            };
            if (editing) mUpdate.mutate({ id: editing.id, data: payload });
            else mCreate.mutate(payload);
          }}
        />
      )}
    </div>
  );
}

function AdvertModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: AdvertDTO;
  onClose: () => void;
  onSubmit: (data: AdvertUpsert) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [targetUrl, setTargetUrl] = useState(initial?.targetUrl ?? "");
  const [startAt, setStartAt] = useState(initial?.startAt ?? "");
  const [endAt, setEndAt] = useState(initial?.endAt ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{initial ? "Rediger annonse" : "Ny annonse"}</h2>
          <button onClick={onClose} className="rounded-lg border border-white/15 px-3 py-1 hover:bg-white/5">Lukk</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm opacity-80">Tittel *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
                   className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" />
          </label>

          <label className="space-y-1">
            <span className="text-sm opacity-80">Lenke (valgfritt)</span>
            <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                   className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" />
          </label>

          <label className="space-y-1">
            <span className="text-sm opacity-80">Start (ISO)</span>
            <input placeholder="2025-09-01T10:00:00Z" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                   className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" />
          </label>

          <label className="space-y-1">
            <span className="text-sm opacity-80">Slutt (ISO)</span>
            <input placeholder="2025-09-30T22:00:00Z" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                   className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm opacity-80">Bilde (valgfritt)</span>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                   className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm opacity-80">Video (valgfritt)</span>
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                   className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5">Avbryt</button>
          <button
            onClick={() => onSubmit({ title, targetUrl, startAt, endAt, imageFile, videoFile })}
            className="rounded-lg px-4 py-2 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          >
            {initial ? "Lagre" : "Opprett"}
          </button>
        </div>
      </div>
    </div>
  );
}
