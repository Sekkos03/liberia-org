// admin-web/src/pages/suggestions/AdminSuggestions.tsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSuggestionsAdmin,
  setSuggestionHandled,
  deleteSuggestionAdmin,
  type SuggestionDTO,
} from "../../lib/suggestions";

export default function AdminSuggestions() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["adminSuggestions", 0],
    queryFn: () => listSuggestionsAdmin(0, 50),
  });

  const mToggle = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => setSuggestionHandled(id, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSuggestions"] });
    },
  });

  const mDelete = useMutation({
    mutationFn: (id: number) => deleteSuggestionAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminSuggestions"] }),
  });

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SuggestionDTO | null>(null);

  function onOpenDetails(item: SuggestionDTO) {
    setSelected(item);
    setOpen(true);
  }

  function toggleHandled(item: SuggestionDTO) {
    mToggle.mutate({ id: item.id, value: !item.handled });
  }

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError)
    return (
      <div className="text-red-500">
        Feil: {(q.error as Error).message ?? "Ukjent feil"}
      </div>
    );

  const items = q.data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold">Forslag (Admin)</h1>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <SuggestionRow
            key={s.id}
            item={s}
            onDetails={() => onOpenDetails(s)}
            onToggle={() => toggleHandled(s)}
            onDelete={() => {
              if (confirm("Slette dette forslaget?")) mDelete.mutate(s.id);
            }}
            busy={mToggle.isPending || mDelete.isPending}
          />
        ))}

        {items.length === 0 && (
          <div className="opacity-70">Ingen forslag enda.</div>
        )}
      </div>

      {/* Details Modal */}
      {open && selected && (
        <Modal onClose={() => setOpen(false)} title="Forslag">
          <div className="space-y-4">
            <KV label="Dato">{fmtDate(selected.createdAt)}</KV>
            <KV label="Navn">{selected.name || "—"}</KV>
            <KV label="E-post">{selected.email || "—"}</KV>

            <div>
              <div className="text-sm opacity-70 mb-1">Melding</div>
              <div className="rounded-lg border border-white/10 p-3 whitespace-pre-wrap">
                {selected.message}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Lukk
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- Row ---------------------------------- */

function SuggestionRow({
  item,
  onDetails,
  onToggle,
  onDelete,
  busy,
}: {
  item: SuggestionDTO;
  onDetails: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy?: boolean;
}) {
  const handledBadge = useMemo(
    () => (
      <span
        className={
          "inline-flex items-center rounded-md px-2 py-0.5 text-sm " +
          (item.handled
            ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/40"
            : "bg-rose-900/40 text-rose-200 border border-rose-700/40")
        }
        title="Håndtert"
      >
        {item.handled ? "Ja" : "Nei"}
      </span>
    ),
    [item.handled]
  );

  return (
    <div className="rounded-xl border border-white/10 p-4 flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="font-semibold">
          {(item.name || item.email || "Anonym")}{" "}
          <span className="opacity-60 font-normal">• {fmtDate(item.createdAt)}</span>
        </div>

        {item.email && <div className="text-sm opacity-80">{item.email}</div>}

        <div className="text-sm opacity-70 line-clamp-2">{item.message}</div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {handledBadge}

        <button
          onClick={onToggle}
          disabled={busy}
          className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
          title={item.handled ? "Marker som ikke håndtert" : "Marker som håndtert"}
        >
          {item.handled ? "Angre" : "Håndter"}
        </button>

        <button
          onClick={onDetails}
          className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
          title="Detaljer"
        >
          Detaljer
        </button>

        <button
          onClick={onDelete}
          disabled={busy}
          className="rounded-lg px-3 py-1 border border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
          title="Slett"
        >
          Slett
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- UI ----------------------------------- */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            className="rounded-lg px-2 py-1 border border-white/15 hover:bg-white/5"
            onClick={onClose}
            aria-label="Lukk"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <div className="text-sm opacity-70">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("no-NO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
