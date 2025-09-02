// admin-web/src/pages/events/AdminEvents.tsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventPublished,
  type EventDTO,
  type EventUpsert,
  type Page,
} from "../../lib/api";

/* ---------- utils for datetime-local <-> ISO (Offset/UTC 'Z') ---------- */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function localInputToIso(v?: string | null): string | null {
  if (!v) return null;
  // interpret local time and send as UTC ISO (Z) — backend OffsetDateTime handles it
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/* --------------------------- local form model --------------------------- */
type FormValues = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  coverImageUrl: string;
  rsvpUrl: string;
  startAt: string; // datetime-local value
  endAt: string; // datetime-local value
  galleryAlbumId: string; // keep as string for input; convert to number|null on submit
};

const emptyForm: FormValues = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  location: "",
  coverImageUrl: "",
  rsvpUrl: "",
  startAt: "",
  endAt: "",
  galleryAlbumId: "",
};

export default function AdminEvents() {
  const qc = useQueryClient();

  const q = useQuery<Page<EventDTO>>({
    queryKey: ["adminEvents", 0],
    queryFn: () => listAdminEvents(0, 50),
  });

  const mPublish = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) =>
      setEventPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminEvents"] }),
  });

  const mCreate = useMutation({
    mutationFn: (payload: EventUpsert) => createEvent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      closeForm();
    },
  });

  const mUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EventUpsert }) =>
      updateEvent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminEvents"] });
      closeForm();
    },
  });

  const mDelete = useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminEvents"] }),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventDTO | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function openEdit(ev: EventDTO) {
    setEditing(ev);
    setForm({
      slug: ev.slug ?? "",
      title: ev.title ?? "",
      summary: ev.summary ?? "",
      description: ev.description ?? "",
      location: ev.location ?? "",
      coverImageUrl: ev.coverImageUrl ?? "",
      rsvpUrl: ev.rsvpUrl ?? "",
      startAt: isoToLocalInput(ev.startAt),
      endAt: isoToLocalInput(ev.endAt),
      galleryAlbumId: ev.galleryAlbumId ? String(ev.galleryAlbumId) : "",
    });
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function togglePublished(ev: EventDTO) {
    mPublish.mutate({ id: ev.id, value: !ev.published });
  }

  function onChange<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const submitDisabled = useMemo(() => {
    return (editing ? mUpdate.isPending : mCreate.isPending) || !form.slug || !form.title;
  }, [editing, mUpdate.isPending, mCreate.isPending, form.slug, form.title]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: EventUpsert = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      coverImageUrl: form.coverImageUrl.trim() || null,
      rsvpUrl: form.rsvpUrl.trim() || null,
      startAt: localInputToIso(form.startAt),
      endAt: localInputToIso(form.endAt),
      galleryAlbumId: form.galleryAlbumId.trim()
        ? Number(form.galleryAlbumId.trim())
        : null,
    };
    if (editing) {
      mUpdate.mutate({ id: editing.id, payload });
    } else {
      mCreate.mutate(payload);
    }
  }

  function handleDelete(ev: EventDTO) {
    if (!confirm(`Slett event "${ev.title}"?`)) return;
    mDelete.mutate(ev.id);
  }

  function autoSlug() {
    if (!form.title) return;
    const s = form.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    onChange("slug", s);
  }

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-500">Feil: {(q.error as Error).message}</div>;

  const items = q.data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold">Events (Admin)</h1>
        <button
          onClick={openCreate}
          className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5"
        >
          + Ny event
        </button>
      </div>

      {/* List */}
      <ul className="space-y-3">
        {items.map((ev) => (
          <li
            key={ev.id}
            className="rounded-xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="font-semibold text-lg">{ev.title}</div>
              <div className="text-sm opacity-70">{ev.slug}</div>
              <div className="text-xs opacity-70">
                {ev.startAt
                  ? `Starter: ${new Date(ev.startAt).toLocaleString()}`
                  : "Start: —"}
                {ev.endAt ? `  ·  Slutt: ${new Date(ev.endAt).toLocaleString()}` : ""}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePublished(ev)}
                className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                disabled={mPublish.isPending}
                title={ev.published ? "Avpubliser" : "Publiser"}
              >
                {ev.published ? "Publisert" : "Upublisert"}
              </button>

              <button
                onClick={() => openEdit(ev)}
                className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
              >
                Rediger
              </button>

              <button
                onClick={() => handleDelete(ev)}
                className="rounded-lg px-3 py-1 border border-red-400/50 text-red-300 hover:bg-red-500/10"
                disabled={mDelete.isPending}
              >
                Slett
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="opacity-60">Ingen events enda. Klikk “Ny event”.</li>
        )}
      </ul>

      {/* Drawer / Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-900 p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {editing ? "Rediger event" : "Ny event"}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
              >
                Lukk
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <LabeledInput
                  label="Tittel *"
                  value={form.title}
                  onChange={(v) => onChange("title", v)}
                  onBlur={autoSlug}
                />
                <LabeledInput
                  label="Slug *"
                  value={form.slug}
                  onChange={(v) => onChange("slug", v)}
                  hint="automatisk fra tittel – kan justeres"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <LabeledInput
                  label="Sted"
                  value={form.location}
                  onChange={(v) => onChange("location", v)}
                />
                <LabeledInput
                  label="RSVP URL"
                  value={form.rsvpUrl}
                  onChange={(v) => onChange("rsvpUrl", v)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <LabeledInput
                  label="Cover-bilde URL"
                  value={form.coverImageUrl}
                  onChange={(v) => onChange("coverImageUrl", v)}
                />
                <LabeledInput
                  label="Galleri Album ID"
                  type="number"
                  value={form.galleryAlbumId}
                  onChange={(v) => onChange("galleryAlbumId", v)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <LabeledInput
                  label="Start"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(v) => onChange("startAt", v)}
                />
                <LabeledInput
                  label="Slutt"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(v) => onChange("endAt", v)}
                />
              </div>

              <LabeledTextarea
                label="Sammendrag"
                value={form.summary}
                onChange={(v) => onChange("summary", v)}
              />

              <LabeledTextarea
                label="Beskrivelse"
                value={form.description}
                onChange={(v) => onChange("description", v)}
                rows={8}
              />

              {(mCreate.isError || mUpdate.isError) && (
                <div className="text-red-400 text-sm">
                  {(mCreate.error as Error)?.message ||
                    (mUpdate.error as Error)?.message}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5 disabled:opacity-60"
                  disabled={submitDisabled}
                >
                  {editing
                    ? mUpdate.isPending
                      ? "Lagrer…"
                      : "Lagre endringer"
                    : mCreate.isPending
                    ? "Oppretter…"
                    : "Opprett"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-4 py-2 border border-white/10 hover:bg-white/5"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- UI subcomponents ----------------------------- */
function LabeledInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  onBlur?: () => void;
}) {
  const { label, value, onChange, type = "text", hint, onBlur } = props;
  return (
    <label className="block">
      <div className="mb-1 text-sm opacity-80">{label}</div>
      <input
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white text-slate-900 placeholder-slate-400 px-3 py-2 outline-none ring-0 border border-black/10"
        placeholder=""
      />
      {hint && <div className="mt-1 text-xs opacity-60">{hint}</div>}
    </label>
  );
}

function LabeledTextarea(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const { label, value, onChange, rows = 4 } = props;
  return (
    <label className="block">
      <div className="mb-1 text-sm opacity-80">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white text-slate-900 placeholder-slate-400 px-3 py-2 outline-none ring-0 border border-black/10"
      />
    </label>
  );
}
