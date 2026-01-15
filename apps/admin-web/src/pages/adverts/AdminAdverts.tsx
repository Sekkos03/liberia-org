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
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, X, Video, Image, Link2, Clock, Calendar } from "lucide-react";

/* ---------- Style constants ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5`;
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white px-3 py-2`;
const btnSmall = "px-2.5 py-1.5 text-sm";
const inputBase = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-white/40";
const cardBase = "rounded-2xl border border-white/10 bg-[rgba(10,18,36,0.5)]";

/* ---------- Date helpers ---------- */
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

function addDurationIso(startIso: string, preset: "" | "1d" | "7d" | "30d"): string {
  if (!startIso) return "";
  const d = new Date(startIso);
  const days = preset === "1d" ? 1 : preset === "7d" ? 7 : preset === "30d" ? 30 : 0;
  if (!days) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Failed to load adverts. Please try again.
      </div>
    );
  }

  const items = q.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Adverts</h1>
          <p className="text-white/60 text-sm mt-1">Manage promotional content and advertisements</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className={btnPrimary}
        >
          <Plus size={18} />
          <span>New advert</span>
        </button>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white/80">No adverts yet</h3>
          <p className="text-white/50 mt-1">Create your first advert to get started</p>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className={`${btnPrimary} mt-4`}
          >
            <Plus size={18} />
            <span>Create advert</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((a) => (
            <div
              key={a.id}
              className={`${cardBase} overflow-hidden hover:border-white/20 transition-all duration-300`}
            >
              <div className="flex gap-4 p-4">
                {/* Media Preview */}
                <div className="shrink-0">
                  {a.videoUrl ? (
                    <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-white/10">
                      <video
                        src={toPublicUrl(a.videoUrl)}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video size={20} className="text-white" />
                      </div>
                    </div>
                  ) : a.imageUrl ? (
                    <img
                      src={toPublicUrl(a.imageUrl)}
                      alt={a.title}
                      className="w-24 h-20 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-20 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <Image size={24} className="text-white/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate flex items-center gap-2">
                        {a.title}
                        {a.videoUrl && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-indigo-200">
                            Video
                          </span>
                        )}
                      </h3>
                      {a.targetUrl && (
                        <div className="flex items-center gap-1 text-xs text-white/50 mt-1 truncate">
                          <Link2 size={12} />
                          <span className="truncate">{a.targetUrl}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {a.active ? <Eye size={10} /> : <EyeOff size={10} />}
                      {a.active ? "Active" : "Hidden"}
                    </span>
                  </div>

                  {/* Schedule */}
                  {(a.startAt || a.endAt) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/50">
                      {a.startAt && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Start: {formatDateTime(a.startAt)}</span>
                        </div>
                      )}
                      {a.endAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>End: {formatDateTime(a.endAt)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-2">
                <button
                  onClick={() => mPublish.mutate({ id: a.id, value: !a.active })}
                  disabled={mPublish.isPending}
                  className={`${btnGhost} ${btnSmall}`}
                  title={a.active ? "Hide" : "Publish"}
                >
                  {a.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="hidden sm:inline">{a.active ? "Hide" : "Publish"}</span>
                </button>
                <button
                  onClick={() => {
                    setEditing(a);
                    setOpen(true);
                  }}
                  className={`${btnGhost} ${btnSmall}`}
                  title="Edit"
                >
                  <Pencil size={14} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete advert "${a.title}"?`)) mDelete.mutate(a.id);
                  }}
                  className={`${btnDanger} ${btnSmall}`}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <AdvertModal
          initial={editing ?? undefined}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={(payload) => {
            if (editing) mUpdate.mutate({ id: editing.id, data: payload });
            else mCreate.mutate(payload);
          }}
          isLoading={mCreate.isPending || mUpdate.isPending}
        />
      )}
    </div>
  );
}

function AdvertModal({
  initial,
  onClose,
  onSubmit,
  isLoading,
}: {
  initial?: AdvertDTO;
  onClose: () => void;
  onSubmit: (data: AdvertUpsert) => void;
  isLoading?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [targetUrl, setTargetUrl] = useState(initial?.targetUrl ?? "");

  const startParts = partsFromIso(initial?.startAt);
  const endParts = partsFromIso(initial?.endAt);

  const [startDate, setStartDate] = useState(startParts.date);
  const [startTime, setStartTime] = useState(startParts.time || "00:00:00");
  const [endDate, setEndDate] = useState(endParts.date);
  const [endTime, setEndTime] = useState(endParts.time || "00:00:00");

  const [duration, setDuration] = useState<"" | "1d" | "7d" | "30d">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  function applyDuration(preset: "" | "1d" | "7d" | "30d") {
    setDuration(preset);
    if (!preset) return;

    const startIso = isoFromLocalParts(startDate, startTime);
    if (!startIso) return;

    const endIso = addDurationIso(startIso, preset);
    const parts = partsFromIso(endIso);
    setEndDate(parts.date);
    setEndTime(parts.time);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold">{initial ? "Edit advert" : "New advert"}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm text-white/70">Title *</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputBase}
                placeholder="Advert title"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm text-white/70">Target URL (optional)</span>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className={inputBase}
                placeholder="https://example.com"
              />
            </label>
          </div>

          {/* Schedule Section */}
          <div className={`${cardBase} p-4 space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-white/60" />
                Schedule
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Duration</span>
                <select
                  value={duration}
                  onChange={(e) => applyDuration(e.target.value as any)}
                  className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm outline-none"
                >
                  <option value="">Manual</option>
                  <option value="1d">1 day</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-sm text-white/60 font-medium">Start</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-xs text-white/50">Date (dd/mm/yyyy)</span>
                    <input
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (duration) applyDuration(duration);
                      }}
                      placeholder="01/09/2025"
                      className={inputBase}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-white/50">Time</span>
                    <input
                      type="time"
                      step={1}
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        if (duration) applyDuration(duration);
                      }}
                      className={inputBase}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-white/60 font-medium">End</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-xs text-white/50">Date (dd/mm/yyyy)</span>
                    <input
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="30/09/2025"
                      className={inputBase}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-white/50">Time</span>
                    <input
                      type="time"
                      step={1}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={inputBase}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm text-white/70 flex items-center gap-2">
                <Image size={14} />
                Image (optional)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className={`${inputBase} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white/80 file:text-sm file:cursor-pointer`}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm text-white/70 flex items-center gap-2">
                <Video size={14} />
                Video (optional)
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                className={`${inputBase} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white/80 file:text-sm file:cursor-pointer`}
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={() => {
              const startAt = isoFromLocalParts(startDate, startTime);
              const endAt = isoFromLocalParts(endDate, endTime);

              const payload: AdvertUpsert = {
                title,
                targetUrl,
                startAt: startAt || undefined,
                endAt: endAt || undefined,
                imageFile: imageFile ?? null,
                videoFile: videoFile ?? null,
              };

              onSubmit(payload);
            }}
            className={btnPrimary}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{initial ? "Save changes" : "Create advert"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}