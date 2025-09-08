import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listAlbumsAdmin,
  createAlbum,
  deleteAlbum,
  setAlbumPublished,
  type AlbumDTO,
  type AlbumUpsert,
} from "../../lib/albums";
import {
  listAdminEvents,
  updateEvent,
  type EventDTO,
  type EventUpsertRequest,
} from "../../lib/events";

/* ------------------------------- UI helpers ------------------------------- */

const badgeBase =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
const badgeYes = badgeBase + " bg-green-900/30 text-green-300 border border-green-700/40";
const badgeNo  = badgeBase + " bg-zinc-800 text-zinc-300 border border-white/10";

const btnBase =
  "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold border transition";
const btnPrimary =
  btnBase + " bg-indigo-600/95 hover:bg-indigo-600 text-white border-indigo-500";
const btnGhost =
  btnBase + " bg-transparent hover:bg-white/5 text-white/90 border-white/15";
const btnDanger =
  btnBase + " bg-red-600/90 hover:bg-red-600 text-white border-red-600/70";

const card =
  "rounded-2xl border border-white/10 bg-[rgba(10,18,36,.7)] p-4 flex flex-col gap-3";

/* ---------------------------- Component start ----------------------------- */

export default function AdminAlbums() {
  const qc = useQueryClient();

  /* modal state */
  const [creating, setCreating] = useState(false);
  const emptyForm = (): AlbumUpsert => ({ slug: "", title: "", description: "" });
  const [form, setForm] = useState<AlbumUpsert>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  /* valgt event for kobling når vi oppretter album */
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  /* ------------------------------- List albums ------------------------------ */

  const page = 0;
  const size = 50;

  const q = useQuery({
    queryKey: ["adminAlbums", page, size],
    queryFn: () => listAlbumsAdmin(page, size),
  });

  const rows: AlbumDTO[] = useMemo(() => q.data?.content ?? [], [q.data]);

  /* -------------------------- Hent events for select ------------------------ */

  const eventsQ = useQuery({
    queryKey: ["adminAlbums.eventsSelect", 0, 200],
    queryFn: () => listAdminEvents(0, 200),
  });
  const eventOptions: EventDTO[] = eventsQ.data?.content ?? [];

  /* --------------------------------- Mutations ------------------------------ */

  // Opprett album, og KNYTT det til valgt event etterpå (galleryAlbumId)
  const mCreate = useMutation({
    mutationFn: (payload: AlbumUpsert) => createAlbum(payload),
    onSuccess: async (created) => {
      // lukk dialog, reset
      setCreating(false);
      setForm(emptyForm());
      const chosen = selectedEventId;
      setSelectedEventId("");
      setError(null);

      // oppfrisk album-listen
      qc.invalidateQueries({ queryKey: ["adminAlbums"] });

      // hvis admin valgte et event: oppdater eventet med ny kobling
      if (chosen) {
        const ev = eventOptions.find((e) => String(e.id) === String(chosen));
        if (ev) {
          const body: EventUpsertRequest = {
            slug: ev.slug,
            title: ev.title,
            summary: ev.summary,
            description: ev.description,
            location: ev.location,
            coverImageUrl: ev.coverImageUrl,
            rsvpUrl: (ev as any).rsvpUrl ?? undefined,
            startAt: ev.startAt,
            endAt: ev.endAt,
            isPublished: ev.isPublished,
            // ← KOBLINGEN:
            galleryAlbumId: created.id,
          };
          try {
            await updateEvent(ev.id, body);
            qc.invalidateQueries({ queryKey: ["admin-events"] });
          } catch (e: any) {
            setError(
              "Album ble opprettet, men kobling til event feilet: " +
                (e?.message ?? "ukjent feil")
            );
          }
        }
      }
    },
    onError: (e: any) => setError(e?.message ?? "Kunne ikke opprette album"),
  });

  // Publish / Unpublish
  const mTogglePub = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      setAlbumPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  // Slett
  const mDelete = useMutation({
    mutationFn: (id: number) => deleteAlbum(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  /* --------------------------------- Render -------------------------------- */

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-400">Feil ved henting av album</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Albums (Admin)</h1>
        <button className={btnPrimary} onClick={() => { setCreating(true); setError(null); }}>
          Nytt album
        </button>
      </div>

      {/* liste */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((a) => (
          <li key={a.id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-lg truncate">{a.title}</div>
                <div className="text-sm text-white/70 truncate">@{a.slug}</div>
              </div>
              <span className={a.published ? badgeYes : badgeNo}>
                {a.published ? "Publisert" : "Upublisert"}
              </span>
            </div>

            {a.description && (
              <div className="text-sm text-white/80 line-clamp-3">{a.description}</div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                className={btnGhost}
                onClick={() => mTogglePub.mutate({ id: a.id, value: !a.published })}
              >
                {a.published ? "Unpublish" : "Publish"}
              </button>

              <button
                className={btnDanger}
                onClick={() => {
                  if (confirm(`Slette album “${a.title}”?`)) {
                    mDelete.mutate(a.id);
                  }
                }}
                disabled={mDelete.isPending}
              >
                Slett
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* --------------------------- Create modal --------------------------- */}
      {creating && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="w-[min(720px,92vw)] rounded-2xl bg-[#0b1426] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nytt album</h2>
              <button className={btnGhost} onClick={() => setCreating(false)}>
                Lukk
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                <span>Beskrivelse (valgfritt)</span>
                <textarea
                  className="bg-transparent border border-white/15 rounded-lg px-3 py-2 min-h-[90px]"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Kort beskrivelse av albumet…"
                />
              </label>

              {/* NYTT: velg event å knytte albumet til */}
              <label className="md:col-span-2 flex flex-col gap-2">
                <span>Knytt til event (valgfritt)</span>
                <select
                  className="bg-transparent border border-white/15 rounded-lg px-3 py-2"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">— Ikke knytt til event —</option>
                  {eventOptions.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.slug})
                    </option>
                  ))}
                </select>
                {eventsQ.isLoading && <span className="text-xs opacity-70">Laster events…</span>}
                {eventsQ.isError && (
                  <span className="text-xs text-red-400">Kunne ikke hente events</span>
                )}
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-600/20 border border-red-600/50 text-red-200 px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button className={btnGhost} onClick={() => setCreating(false)}>
                Avbryt
              </button>
              <button
                className={btnPrimary}
                onClick={() => {
                  if (!form.slug.trim() || !form.title.trim()) {
                    setError("Slug og tittel må fylles ut.");
                    return;
                  }
                  mCreate.mutate(form);
                }}
                disabled={mCreate.isPending}
              >
                Opprett album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
