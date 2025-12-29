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

/* ---------- helpers dd/mm/yyyy + HH:mm:ss ---------- */
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
  // behold "Z" og dropp ms
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
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
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="rounded-lg bg-white/5 px-4 py-2 hover:bg-white/10 border border-white/15"
        >
          Ny annonse
        </button>
      </div>

      <ul className="space-y-4">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-white/10 p-4"
          >
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
                <div className="h-12 w-16 rounded-md border border-white/10 grid place-items-center text-xs opacity-60">
                  no img
                </div>
              )}

              <div>
                <div className="font-semibold flex items-center gap-2">
                  {a.title}
                  {a.videoUrl && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/30 border border-indigo-400/30 text-indigo-200">
                      Video
                    </span>
                  )}
                </div>
                {a.targetUrl && <div className="text-xs opacity-70 break-all">{a.targetUrl}</div>}
                {(a.startAt || a.endAt) && (
                  <div className="text-xs opacity-60 mt-1">
                    {a.startAt ? `Start: ${new Date(a.startAt).toLocaleString()}` : ""}
                    {a.startAt && a.endAt ? " · " : ""}
                    {a.endAt ? `Slutt: ${new Date(a.endAt).toLocaleString()}` : ""}
                  </div>
                )}
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
                onClick={() => {
                  setEditing(a);
                  setOpen(true);
                }}
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
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={(payload) => {
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

  const startParts = partsFromIso(initial?.startAt);
  const endParts = partsFromIso(initial?.endAt);

  const [startDate, setStartDate] = useState(startParts.date);
  const [startTime, setStartTime] = useState(startParts.time || "00:00:00");
  const [endDate, setEndDate] = useState(endParts.date);
  const [endTime, setEndTime] = useState(endParts.time || "00:00:00");

  const [duration, setDuration] = useState<"" | "1d" | "7d" | "30d">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // auto-set endAt når varighet velges og vi har start
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{initial ? "Rediger annonse" : "Ny annonse"}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 px-3 py-1 hover:bg-white/5"
          >
            Lukk
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm opacity-80">Tittel *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm opacity-80">Lenke (valgfritt)</span>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
            />
          </label>

          {/* START */}
          <div className="md:col-span-2 rounded-xl border border-white/10 p-4 bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Start</div>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-70">Varighet</span>
                <select
                  value={duration}
                  onChange={(e) => applyDuration(e.target.value as any)}
                  className="rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-sm"
                >
                  <option value="">Manuelt</option>
                  <option value="1d">1 dag</option>
                  <option value="7d">7 dager</option>
                  <option value="30d">30 dager</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-sm opacity-80">Dato (dd/mm/yyyy)</span>
                <input
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (duration) applyDuration(duration);
                  }}
                  placeholder="01/09/2025"
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm opacity-80">Tid (HH:MM:SS)</span>
                <input
                  type="time"
                  step={1}
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (duration) applyDuration(duration);
                  }}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
                />
              </label>
            </div>
          </div>

          {/* END */}
          <div className="md:col-span-2 rounded-xl border border-white/10 p-4 bg-black/20">
            <div className="font-semibold mb-3">Slutt</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-sm opacity-80">Dato (dd/mm/yyyy)</span>
                <input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="30/09/2025"
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm opacity-80">Tid (HH:MM:SS)</span>
                <input
                  type="time"
                  step={1}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
                />
              </label>
            </div>
          </div>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm opacity-80">Bilde (valgfritt)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm opacity-80">Video (valgfritt)</span>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5"
          >
            Avbryt
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
            className="rounded-lg px-4 py-2 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          >
            {initial ? "Lagre" : "Opprett"}
          </button>
        </div>
      </div>
    </div>
  );
}
