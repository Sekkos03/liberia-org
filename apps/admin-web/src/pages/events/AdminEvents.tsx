import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEvent,
  deleteEvent,
  listAdminEvents,
  setEventPublished,
  updateEvent,
  type EventDTO,
  type EventUpsertRequest,
} from '../../lib/api';

type FormState = {
  id?: number | null;
  slug: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  coverImageUrl: string;
  rsvpUrl: string;
  startAt: string; // ISO string
  endAt: string;   // ISO string
  galleryAlbumId: string; // keep string for input
  isPublished: boolean;
};

const emptyForm = (): FormState => ({
  id: null,
  slug: '',
  title: '',
  summary: '',
  description: '',
  location: '',
  coverImageUrl: '',
  rsvpUrl: '',
  startAt: '',
  endAt: '',
  galleryAlbumId: '',
  isPublished: false,
});

// 👇 shared, high-contrast input style (light + dark)
const inputCls =
  'w-full rounded-lg border px-3 py-2 ' +
  'bg-white text-gray-900 placeholder-gray-400 border-gray-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
  'dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-700';

const btnBase =
  'px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700';

export default function AdminEvents() {
  const qc = useQueryClient();
  const [page] = useState(0);
  const [size] = useState(20);
  const [editing, setEditing] = useState<FormState>(emptyForm());
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['admin-events', page, size],
    queryFn: () => listAdminEvents(page, size),
  });

  const rows: EventDTO[] = useMemo(() => q.data?.content ?? [], [q.data]);

  const onClose = () => {
    setOpen(false);
    setEditing(emptyForm());
    setError(null);
  };

  const onEdit = (e: EventDTO) => {
    setEditing({
      id: e.id,
      slug: e.slug ?? '',
      title: e.title ?? '',
      summary: e.summary ?? '',
      description: e.description ?? '',
      location: e.location ?? '',
      coverImageUrl: e.coverImageUrl ?? '',
      rsvpUrl: e.rsvpUrl ?? '',
      startAt: e.startAt ?? '',
      endAt: e.endAt ?? '',
      galleryAlbumId: e.galleryAlbumId != null ? String(e.galleryAlbumId) : '',
      isPublished: !!e.isPublished,
    });
    setOpen(true);
  };

  const createM = useMutation({
    mutationFn: (body: EventUpsertRequest) => createEvent(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      onClose();
    },
    onError: (err: any) => setError(err?.message ?? 'Kunne ikke opprette event'),
  });

  const updateM = useMutation({
    mutationFn: (vars: { id: number; body: EventUpsertRequest }) =>
      updateEvent(vars.id, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      onClose();
    },
    onError: (err: any) => setError(err?.message ?? 'Kunne ikke oppdatere event'),
  });

  const deleteM = useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events'] }),
    onError: (err: any) => alert(err?.message ?? 'Kunne ikke slette'),
  });

  const publishM = useMutation({
    mutationFn: (vars: { id: number; value: boolean }) =>
      setEventPublished(vars.id, vars.value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events'] }),
    onError: (err: any) => alert(err?.message ?? 'Kunne ikke endre publiseringsstatus'),
  });

  const submit = () => {
    setError(null);

    if (!editing.slug.trim()) return setError('Slug er påkrevd');
    if (!editing.title.trim()) return setError('Tittel er påkrevd');

    const body: EventUpsertRequest = {
      slug: editing.slug.trim(),
      title: editing.title.trim(),
      summary: editing.summary || null,
      description: editing.description || null,
      location: editing.location || null,
      coverImageUrl: editing.coverImageUrl || null,
      rsvpUrl: editing.rsvpUrl || null,
      startAt: editing.startAt || null,
      endAt: editing.endAt || null,
      galleryAlbumId: editing.galleryAlbumId ? Number(editing.galleryAlbumId) : null,
      isPublished: editing.isPublished,
    };

    if (!editing.id) createM.mutate(body);
    else updateM.mutate({ id: editing.id, body });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events (Admin)</h1>
        <button
          className="rounded-lg px-4 py-2 border hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
          onClick={() => {
            setEditing(emptyForm());
            setOpen(true);
          }}
        >
          + Ny event
        </button>
      </div>

      {q.isLoading ? (
        <div>Laster…</div>
      ) : q.isError ? (
        <div className="text-red-500">Feil: {(q.error as any)?.message}</div>
      ) : (
        <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>ID</th>
                <th>Slug</th>
                <th>Tittel</th>
                <th>Start</th>
                <th>Publisert</th>
                <th className="text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-gray-200 dark:border-gray-800 [&>td]:px-3 [&>td]:py-2">
                  <td>{e.id}</td>
                  <td className="font-mono">{e.slug}</td>
                  <td>{e.title}</td>
                  <td>{e.startAt ? new Date(e.startAt).toLocaleString() : '—'}</td>
                  <td>
                    {e.isPublished ? (
                      <span className="rounded bg-green-100 text-green-800 px-2 py-0.5 dark:bg-green-900/30 dark:text-green-300">
                        Ja
                      </span>
                    ) : (
                      <span className="rounded bg-yellow-100 text-yellow-800 px-2 py-0.5 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Nei
                      </span>
                    )}
                  </td>
                  <td className="text-right space-x-2">
                    {e.isPublished ? (
                      <button
                        className={btnBase}
                        disabled={publishM.isPending}
                        onClick={() => publishM.mutate({ id: e.id, value: false })}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        className={btnBase}
                        disabled={publishM.isPending}
                        onClick={() => publishM.mutate({ id: e.id, value: true })}
                      >
                        Publish
                      </button>
                    )}

                    <button className={btnBase} onClick={() => onEdit(e)}>
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      disabled={deleteM.isPending}
                      onClick={() => {
                        if (confirm('Slette event?')) deleteM.mutate(e.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    Ingen events enda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Upsert dialog */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editing.id ? 'Rediger event' : 'Ny event'}
              </h2>
              <button
                className="text-gray-500 hover:text-black dark:hover:text-white"
                onClick={onClose}
                aria-label="Lukk"
                title="Lukk"
              >
                ✕
              </button>
            </div>

            {error && <div className="text-red-600">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Slug *</span>
                <input
                  className={inputCls}
                  value={editing.slug}
                  onChange={(e) => setEditing((s) => ({ ...s, slug: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Tittel *</span>
                <input
                  className={inputCls}
                  value={editing.title}
                  onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                />
              </label>

              <label className="space-y-1 col-span-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Sammendrag</span>
                <input
                  className={inputCls}
                  value={editing.summary}
                  onChange={(e) => setEditing((s) => ({ ...s, summary: e.target.value }))}
                />
              </label>

              <label className="space-y-1 col-span-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Beskrivelse (markdown/HTML)</span>
                <textarea
                  className={inputCls}
                  rows={4}
                  value={editing.description}
                  onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Sted</span>
                <input
                  className={inputCls}
                  value={editing.location}
                  onChange={(e) => setEditing((s) => ({ ...s, location: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Cover image URL</span>
                <input
                  className={inputCls}
                  value={editing.coverImageUrl}
                  onChange={(e) => setEditing((s) => ({ ...s, coverImageUrl: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">RSVP URL</span>
                <input
                  className={inputCls}
                  value={editing.rsvpUrl}
                  onChange={(e) => setEditing((s) => ({ ...s, rsvpUrl: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Start (ISO, f.eks. 2025-09-01T18:00:00Z)
                </span>
                <input
                  className={`${inputCls} font-mono`}
                  placeholder="2025-09-01T18:00:00Z"
                  value={editing.startAt}
                  onChange={(e) => setEditing((s) => ({ ...s, startAt: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Slutt (ISO)</span>
                <input
                  className={`${inputCls} font-mono`}
                  placeholder="2025-09-01T20:00:00Z"
                  value={editing.endAt}
                  onChange={(e) => setEditing((s) => ({ ...s, endAt: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Album-ID (valgfritt)</span>
                <input
                  className={inputCls}
                  type="number"
                  value={editing.galleryAlbumId}
                  onChange={(e) => setEditing((s) => ({ ...s, galleryAlbumId: e.target.value }))}
                />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-indigo-600"
                  checked={editing.isPublished}
                  onChange={(e) => setEditing((s) => ({ ...s, isPublished: e.target.checked }))}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Publisert</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button className={btnBase} onClick={onClose}>
                Avbryt
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-black text-white dark:bg-indigo-600"
                onClick={submit}
                disabled={createM.isPending || updateM.isPending}
              >
                {editing.id ? 'Lagre' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
