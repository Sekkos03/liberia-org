import  { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAdminEvents,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
  setEventPublished,
  type EventDTO,
  type EventUpsertRequest,
  type Page,
  http,
} from "../../lib/events";
import { stripStoredFileToString, toPublicUrl } from "../../lib/media";

/* ---------- helpers for dd/mm/yyyy + HH:mm ---------- */
/** Lag ISO uten millisekunder i UTC, f.eks. 2025-11-24T05:00:00Z */
function isoFromLocalParts(dateDDMMYYYY: string, timeHHmm: string): string | null {
  if (!dateDDMMYYYY) return null;
  const [dd, mm, yyyy] = dateDDMMYYYY.split("/").map(Number);
  if (!dd || !mm || !yyyy) return null;

  const [hh, mi] = (timeHHmm || "00:00").split(":").map(Number);
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd, hh || 0, mi || 0, 0));

  const pad = (n: number) => String(n).padStart(2, "0");
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth() + 1);
  const d = pad(dt.getUTCDate());
  const h = pad(dt.getUTCHours());
  const i = pad(dt.getUTCMinutes());
  const s = pad(dt.getUTCSeconds());

  return `${y}-${m}-${d}T${h}:${i}:${s}Z`;
}

function partsFromIso(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${mi}` };
}

/* ---------- cover upload ---------- */
async function uploadCover(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "events/covers");

  const res = await http.post("/api/admin/events/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Backend kan returnere { url: "/uploads/..." } ELLER en "StoredFile[...]"
  const raw =
    (res.data && (res.data.url || res.data.downloadUrl || res.data.path)) ||
    res.data;

  const cleaned = stripStoredFileToString(String(raw)) || "";
  if (!cleaned) throw new Error("Upload response had no URL");

  // Lagre relativ sti i modellen; når vi viser den bruker vi toPublicUrl(...)
  return cleaned;
}

/* ---------- form state ---------- */
type FormState = {
  id?: number | null;
  slug: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  coverImageUrl: string;
  rsvpUrl: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  galleryAlbumId: string;
  isPublished: boolean;
  startAt?: string | null;
  endAt?: string | null;
};

const emptyForm = (): FormState => ({
  id: null,
  slug: "",
  title: "",
  summary: "",
  description: "",
  location: "",
  coverImageUrl: "",
  rsvpUrl: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  galleryAlbumId: "",
  isPublished: false,
  startAt: null,
  endAt: null,
});

export default function AdminEvents() {
  const qc = useQueryClient();

  // enkel paginering
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  // ✅ React Query v5: bruk placeholderData i stedet for keepPreviousData
  const q = useQuery<Page<EventDTO>>({
    queryKey: ["admin-events", page, size],
    queryFn: () => listAdminEvents(page, size),
    placeholderData: (prev) => prev, // beholder forrige side mens ny hentes
  });

  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState>(emptyForm());

  const createM = useMutation({
    mutationFn: (b: EventUpsertRequest) => apiCreateEvent(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });
  const updateM = useMutation({
    mutationFn: (p: { id: number; body: EventUpsertRequest }) =>
      apiUpdateEvent(p.id, p.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });
  const delM = useMutation({
    mutationFn: (id: number) => apiDeleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const onNew = () => {
    setErr(null);
    setEditing(emptyForm());
    setOpen(true);
  };

  const onEdit = (e: EventDTO) => {
    setErr(null);
    const sp = partsFromIso(e.startAt);
    const ep = partsFromIso(e.endAt);
    setEditing({
      id: e.id,
      slug: e.slug || "",
      title: e.title || "",
      summary: e.summary || "",
      description: e.description || "",
      location: e.location || "",
      coverImageUrl: e.coverImageUrl || "",
      rsvpUrl: e.rsvpUrl || "",
      startDate: sp.date,
      startTime: sp.time,
      endDate: ep.date,
      endTime: ep.time,
      galleryAlbumId: e.galleryAlbumId != null ? String(e.galleryAlbumId) : "",
      isPublished: !!e.isPublished,
      startAt: e.startAt ?? null,
      endAt: e.endAt ?? null,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      setErr(null);
      if (!editing.slug.trim()) throw new Error("Slug is required");
      if (!editing.title.trim()) throw new Error("Title is required");

      const body: EventUpsertRequest = {
        slug: editing.slug.trim(),
        title: editing.title.trim(),
        summary: editing.summary || null,
        description: editing.description || null,
        location: editing.location || null,
        coverImageUrl: editing.coverImageUrl || null,
        rsvpUrl: editing.rsvpUrl || null,
        startAt: isoFromLocalParts(editing.startDate, editing.startTime),
        endAt: isoFromLocalParts(editing.endDate, editing.endTime),
        galleryAlbumId: editing.galleryAlbumId ? Number(editing.galleryAlbumId) : null,
        isPublished: editing.isPublished,
      };

      if (editing.id) {
        await updateM.mutateAsync({ id: editing.id, body });
      } else {
        await createM.mutateAsync(body);
      }
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    }
  };

  const onUploadFile = async (file: File) => {
    try {
      setErr(null);
      const url = await uploadCover(file);
      if (!url) throw new Error("No URL returned from server");
      setEditing((s) => ({ ...s, coverImageUrl: url }));
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    }
  };

  const header = useMemo(
    () => (
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Events (Admin)</h1>
        <button
  onClick={onNew}
  className="rounded-xl px-4 py-2 border border-white/10 bg-white/10 hover:bg-white/15 transition"
>
  + New event
</button>

      </div>
    ),
    []
  );

  const totalPages = q.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">

      {header}

      {q.isLoading && <div>Loading…</div>}
      {q.isError && <div className="text-red-500">Error loading events</div>}

      {q.data && (
        <>
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900 text-white/90">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Slug</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Start</th>
                  <th className="px-3 py-2 text-left">Published</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data.content ?? []).map((e: EventDTO) => {
                  const s = e.startAt ? new Date(e.startAt).toLocaleString() : "-";
                  return (
                    <tr key={e.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-3 py-2">{e.id}</td>
                      <td className="px-3 py-2">{e.slug}</td>
                      <td className="px-3 py-2">{e.title}</td>
                      <td className="px-3 py-2">{s}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            e.isPublished ? "bg-green-600 text-white" : "bg-slate-300"
                          }`}
                        >
                          {e.isPublished ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          onClick={() =>
                            setEventPublished(e.id, !e.isPublished).then(() =>
                              qc.invalidateQueries({ queryKey: ["admin-events"] })
                            )
                          }
                          className="px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
                        >
                          {e.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => onEdit(e)}
                          className="px-2 py-1 rounded border"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => delM.mutate(e.id)}
                          className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editing.id ? "Edit event" : "New event"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 grid place-items-center rounded border"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic */}
              <label className="space-y-1">
                <span className="text-sm">Slug *</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={editing.slug}
                  onChange={(e) => setEditing((s) => ({ ...s, slug: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm">Title *</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={editing.title}
                  onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm">Summary</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={editing.summary}
                  onChange={(e) => setEditing((s) => ({ ...s, summary: e.target.value }))}
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm">Description (markdown/HTML)</span>
                <textarea
                  className="w-full rounded border px-3 py-2 min-h-[140px]"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </label>

              {/* Location & RSVP */}
              <label className="space-y-1">
                <span className="text-sm">Location</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={editing.location}
                  onChange={(e) => setEditing((s) => ({ ...s, location: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm">RSVP URL</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={editing.rsvpUrl}
                  onChange={(e) => setEditing((s) => ({ ...s, rsvpUrl: e.target.value }))}
                />
              </label>

              {/* Cover upload */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm block">Cover image</span>
                {editing.coverImageUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={toPublicUrl(editing.coverImageUrl)} alt="" className="w-28 h-16 object-cover rounded border" />
                    <button
                      className="px-3 py-2 rounded border"
                      onClick={() => setEditing((s) => ({ ...s, coverImageUrl: "" }))}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadFile(f);
                      }}
                    />
                    <span className="text-xs opacity-70">
                      Select a file to upload (jpg/png/webp). It will be stored on the
                      server and the URL will be saved as the event cover.
                    </span>
                  </div>
                )}
              </div>

              {/* Start/End date/time */}
              <label className="space-y-1">
                <span className="text-sm">Start date (dd/mm/yyyy)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="09/11/2025"
                  value={editing.startDate}
                  onChange={(e) => setEditing((s) => ({ ...s, startDate: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Start time</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  type="time"
                  value={editing.startTime}
                  onChange={(e) => setEditing((s) => ({ ...s, startTime: e.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm">End date (dd/mm/yyyy)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="09/11/2025"
                  value={editing.endDate}
                  onChange={(e) => setEditing((s) => ({ ...s, endDate: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm">End time</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  type="time"
                  value={editing.endTime}
                  onChange={(e) => setEditing((s) => ({ ...s, endTime: e.target.value }))}
                />
              </label>

              {/* Album & published */}
              <label className="space-y-1">
                <span className="text-sm">Album ID (optional)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={editing.galleryAlbumId}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, galleryAlbumId: e.target.value }))
                  }
                />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.isPublished}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, isPublished: e.target.checked }))
                  }
                />
                <span>Published</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={onSubmit}
              >
                {editing.id ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
