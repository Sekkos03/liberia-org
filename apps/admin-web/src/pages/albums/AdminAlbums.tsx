import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listAlbumsAdmin,
  createAlbum,
  deleteAlbum,
  setAlbumPublished,
  type AlbumDTO,
  type AlbumUpsert,
} from "../../lib/albums";

// Små hjelpeklasser for konsistent look
const badgeBase =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
const badgeYes = badgeBase + " bg-green-900/30 text-green-300 border border-green-700/40";
const badgeNo  = badgeBase + " bg-zinc-800 text-zinc-300 border border-white/10";

const btnBase =
  "rounded-lg px-3 py-1.5 border border-white/15 hover:bg-white/5 transition";
const btnDanger =
  "rounded-lg px-3 py-1.5 border border-red-500/30 text-red-300 hover:bg-red-500/10 transition";

export default function AdminAlbums() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AlbumUpsert>({ slug: "", title: "", description: "" });

  // LIST
  const q = useQuery({
    queryKey: ["adminAlbums", 0],
    queryFn: () => listAlbumsAdmin(0, 50),
  });

  // CREATE
  const mCreate = useMutation({
    mutationFn: (payload: AlbumUpsert) => createAlbum(payload),
    onSuccess: () => {
      setCreating(false);
      setForm({ slug: "", title: "", description: "" });
      qc.invalidateQueries({ queryKey: ["adminAlbums"] });
    },
  });

  // DELETE
  const mDelete = useMutation({
    mutationFn: (id: number) => deleteAlbum(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  // PUBLISH/UNPUBLISH
  const mPublish = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      setAlbumPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  function togglePublished(a: AlbumDTO) {
    mPublish.mutate({ id: a.id, value: !a.published });
  }

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-500">Feil: {(q.error as Error).message}</div>;

  const items = q.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-5xl font-extrabold">Album (Admin)</h1>
        <button
          className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5"
          onClick={() => setCreating(true)}
        >
          Nytt album
        </button>
      </div>

      {/* Create modal (enkel) */}
      {creating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-[720px] max-w-[92vw] rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Opprett nytt album</h2>
              <button
                className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                onClick={() => setCreating(false)}
              >
                Lukk
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span>Slug *</span>
                <input
                  className="bg-transparent border border-white/15 rounded-lg px-3 py-2"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="album-1"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span>Tittel *</span>
                <input
                  className="bg-transparent border border-white/15 rounded-lg px-3 py-2"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Album #1"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2">
                <span>Beskrivelse</span>
                <textarea
                  className="bg-transparent border border-white/15 rounded-lg px-3 py-2 min-h-28"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Valgfritt…"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className={btnBase}
                onClick={() => setCreating(false)}
                disabled={mCreate.isPending}
              >
                Avbryt
              </button>
              <button
                className={btnBase}
                onClick={() => mCreate.mutate(form)}
                disabled={mCreate.isPending || !form.slug || !form.title}
              >
                {mCreate.isPending ? "Oppretter…" : "Opprett"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <ul className="space-y-3">
        {items.map((a: AlbumDTO) => (
          <li
            key={a.id}
            className="rounded-xl border border-white/10 p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm opacity-70">{a.slug}</div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status badge (Ja/Nei) */}
              <span className={a.published ? badgeYes : badgeNo}>
                {a.published ? "Ja" : "Nei"}
              </span>

              {/* Toggle button (Unpublish/Publish) */}
              <button
                onClick={() => togglePublished(a)}
                className={btnBase}
                disabled={mPublish.isPending}
              >
                {a.published ? "Unpublish" : "Publish"}
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  if (confirm(`Slette album "${a.title}"?`)) {
                    mDelete.mutate(a.id);
                  }
                }}
                className={btnDanger}
                disabled={mDelete.isPending}
              >
                Slett
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
