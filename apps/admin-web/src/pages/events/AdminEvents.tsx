import { useMemo, useState } from "react";
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
import { Calendar, MapPin, Eye, EyeOff, Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";

/* ---------- helpers for dd/mm/yyyy + HH:mm:ss ---------- */
function isoFromLocalParts(dateDDMMYYYY: string, timeHHmmss: string): string | null {
  if (!dateDDMMYYYY) return null;
  const [dd, mm, yyyy] = dateDDMMYYYY.split("/").map((x) => Number(x));
  if (!dd || !mm || !yyyy) return null;

  const [hhRaw, miRaw, ssRaw] = (timeHHmmss || "00:00:00").split(":");
  const hh = Number(hhRaw ?? 0);
  const mi = Number(miRaw ?? 0);
  const ss = Number(ssRaw ?? 0);

  const dt = new Date(Date.UTC(yyyy, mm - 1, dd, hh || 0, mi || 0, ss || 0));

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
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
  };
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- cover upload ---------- */
async function uploadCover(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "media3/covers");

  const res = await http.post("/api/admin/events/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const raw =
    (res.data && (res.data.url || res.data.downloadUrl || res.data.path)) || res.data;

  const cleaned = stripStoredFileToString(String(raw)) || "";
  if (!cleaned) throw new Error("Upload response had no URL");

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
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
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
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  isPublished: false,
  startAt: null,
  endAt: null,
});

/* ---------- Style constants ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5`;
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white px-3 py-2`;
const btnSmall = "px-2.5 py-1.5 text-sm";

const inputBase = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-white/40";

export default function AdminEvents() {
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const q = useQuery<Page<EventDTO>>({
    queryKey: ["admin-events", page, size],
    queryFn: () => listAdminEvents(page, size),
    placeholderData: (prev) => prev,
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

  const pubM = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => setEventPublished(id, value),
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
      startDate: sp.date,
      startTime: sp.time,
      endDate: ep.date,
      endTime: ep.time,
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
        rsvpUrl: null,
        galleryAlbumId: null,
        startAt: isoFromLocalParts(editing.startDate, editing.startTime),
        endAt: isoFromLocalParts(editing.endDate, editing.endTime),
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

  const totalPages = q.data?.totalPages ?? 1;
  const events = q.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Events</h1>
          <p className="text-white/60 text-sm mt-1">Manage and organize your events</p>
        </div>
        <button onClick={onNew} className={btnPrimary}>
          <Plus size={18} />
          <span>New event</span>
        </button>
      </div>

      {q.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {q.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Error loading events. Please try again.
        </div>
      )}

      {q.data && (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block rounded-2xl border border-white/10 overflow-hidden bg-[rgba(10,18,36,0.5)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((e: EventDTO) => (
                  <tr key={e.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {e.coverImageUrl ? (
                          <img
                            src={toPublicUrl(e.coverImageUrl)}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                            <Calendar size={20} className="text-white/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{e.title}</div>
                          <div className="text-xs text-white/50 truncate">@{e.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar size={14} className="text-white/50 shrink-0" />
                        <span>{formatDateTime(e.startAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {e.location ? (
                        <div className="flex items-center gap-2 text-white/80">
                          <MapPin size={14} className="text-white/50 shrink-0" />
                          <span className="truncate max-w-[200px]">{e.location}</span>
                        </div>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          e.isPublished
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {e.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                        {e.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => pubM.mutate({ id: e.id, value: !e.isPublished })}
                          disabled={pubM.isPending}
                          className={`${btnGhost} ${btnSmall}`}
                          title={e.isPublished ? "Unpublish" : "Publish"}
                        >
                          {e.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => onEdit(e)}
                          className={`${btnGhost} ${btnSmall}`}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${e.title}"?`)) delM.mutate(e.id);
                          }}
                          disabled={delM.isPending}
                          className={`${btnDanger} ${btnSmall}`}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {events.map((e: EventDTO) => (
              <div
                key={e.id}
                className="rounded-2xl border border-white/10 bg-[rgba(10,18,36,0.5)] p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  {e.coverImageUrl ? (
                    <img
                      src={toPublicUrl(e.coverImageUrl)}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                      <Calendar size={24} className="text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{e.title}</h3>
                        <p className="text-xs text-white/50">@{e.slug}</p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          e.isPublished
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {e.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-white/50" />
                    <span>{formatDateTime(e.startAt)}</span>
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-white/50" />
                      <span className="truncate max-w-[150px]">{e.location}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => pubM.mutate({ id: e.id, value: !e.isPublished })}
                    disabled={pubM.isPending}
                    className={`${btnGhost} ${btnSmall} flex-1`}
                  >
                    {e.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{e.isPublished ? "Unpublish" : "Publish"}</span>
                  </button>
                  <button
                    onClick={() => onEdit(e)}
                    className={`${btnGhost} ${btnSmall} flex-1`}
                  >
                    <Pencil size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${e.title}"?`)) delM.mutate(e.id);
                    }}
                    disabled={delM.isPending}
                    className={`${btnDanger} ${btnSmall}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {events.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white/80">No events yet</h3>
              <p className="text-white/50 mt-1">Create your first event to get started</p>
              <button onClick={onNew} className={`${btnPrimary} mt-4`}>
                <Plus size={18} />
                <span>Create event</span>
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={`${btnGhost} ${btnSmall} disabled:opacity-40`}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        page === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white/5 hover:bg-white/10 text-white/70"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={`${btnGhost} ${btnSmall} disabled:opacity-40`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-xl font-bold">{editing.id ? "Edit event" : "New event"}</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {err && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                  {err}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5">
                  <span className="text-sm text-white/70">Slug *</span>
                  <input
                    className={inputBase}
                    placeholder="my-event-slug"
                    value={editing.slug}
                    onChange={(e) => setEditing((s) => ({ ...s, slug: e.target.value }))}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm text-white/70">Title *</span>
                  <input
                    className={inputBase}
                    placeholder="Event title"
                    value={editing.title}
                    onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm text-white/70">Summary</span>
                  <input
                    className={inputBase}
                    placeholder="Brief description"
                    value={editing.summary}
                    onChange={(e) => setEditing((s) => ({ ...s, summary: e.target.value }))}
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm text-white/70">Description</span>
                  <textarea
                    className={`${inputBase} min-h-[120px] resize-y`}
                    placeholder="Full event description (markdown/HTML supported)"
                    value={editing.description}
                    onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm text-white/70">Location</span>
                  <input
                    className={inputBase}
                    placeholder="Event location"
                    value={editing.location}
                    onChange={(e) => setEditing((s) => ({ ...s, location: e.target.value }))}
                  />
                </label>

                {/* Cover image */}
                <div className="md:col-span-2 space-y-2">
                  <span className="text-sm text-white/70 block">Cover image</span>
                  {editing.coverImageUrl ? (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                      <img
                        src={toPublicUrl(editing.coverImageUrl)}
                        alt=""
                        className="w-24 h-16 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        className={`${btnGhost} ${btnSmall}`}
                        onClick={() => setEditing((s) => ({ ...s, coverImageUrl: "" }))}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/30 bg-white/5 cursor-pointer transition">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onUploadFile(f);
                        }}
                      />
                      <div className="text-center">
                        <div className="text-white/60 text-sm">Click to upload cover image</div>
                        <div className="text-white/40 text-xs mt-1">JPG, PNG, WebP (recommended)</div>
                      </div>
                    </label>
                  )}
                </div>

                {/* Date/Time */}
                <label className="space-y-1.5">
                  <span className="text-sm text-white/70">Start date (dd/mm/yyyy)</span>
                  <input
                    className={inputBase}
                    placeholder="11/12/2026"
                    value={editing.startDate}
                    onChange={(e) => setEditing((s) => ({ ...s, startDate: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/70">Start time</span>
                  <input
                    className={inputBase}
                    type="time"
                    step={1}
                    value={editing.startTime}
                    onChange={(e) => setEditing((s) => ({ ...s, startTime: e.target.value }))}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm text-white/70">End date (dd/mm/yyyy)</span>
                  <input
                    className={inputBase}
                    placeholder="11/12/2026"
                    value={editing.endDate}
                    onChange={(e) => setEditing((s) => ({ ...s, endDate: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/70">End time</span>
                  <input
                    className={inputBase}
                    type="time"
                    step={1}
                    value={editing.endTime}
                    onChange={(e) => setEditing((s) => ({ ...s, endTime: e.target.value }))}
                  />
                </label>

                <label className="flex items-center gap-3 md:col-span-2 pt-2">
                  <input
                    type="checkbox"
                    checked={editing.isPublished}
                    onChange={(e) => setEditing((s) => ({ ...s, isPublished: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span className="text-white/80">Publish immediately</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
              <button className={btnGhost} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className={btnPrimary}
                onClick={onSubmit}
                disabled={createM.isPending || updateM.isPending}
              >
                {createM.isPending || updateM.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editing.id ? "Save changes" : "Create event"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}