// admin-web/src/pages/suggestions/AdminSuggestions.tsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSuggestionsAdmin,
  setSuggestionHandled,
  deleteSuggestionAdmin,
  type SuggestionDTO,
} from "../../lib/suggestions";
import { MessageSquare, Check, X, Trash2, Eye, Mail, User, Calendar, CheckCircle, XCircle } from "lucide-react";

/* ---------- Style constants ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnSuccess = `${btnBase} border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white px-3 py-2`;
const btnSmall = "px-2.5 py-1.5 text-sm";
const cardBase = "rounded-2xl border border-white/10 bg-[rgba(10,18,36,0.5)]";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
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
        Error: {(q.error as Error).message ?? "Unknown error"}
      </div>
    );
  }

  const items = q.data?.content ?? [];
  const pendingCount = items.filter((s) => !s.handled).length;
  const handledCount = items.filter((s) => s.handled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Suggestions</h1>
          <p className="text-white/60 text-sm mt-1">Review and manage user feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <XCircle size={14} />
            <span>{pendingCount} pending</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            <CheckCircle size={14} />
            <span>{handledCount} handled</span>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white/80">No suggestions yet</h3>
          <p className="text-white/50 mt-1">User suggestions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div
              key={s.id}
              className={`${cardBase} p-4 transition-all duration-300 ${
                s.handled ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                        <User size={14} className="text-white/60" />
                      </div>
                      <span className="font-semibold">
                        {s.name || s.email || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-sm text-white/50 flex items-center gap-1">
                      <Calendar size={12} />
                      {fmtDate(s.createdAt)}
                    </span>
                    {s.handled && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Handled
                      </span>
                    )}
                  </div>

                  {s.email && s.name && (
                    <div className="flex items-center gap-1 text-sm text-white/60 mt-2">
                      <Mail size={12} />
                      {s.email}
                    </div>
                  )}

                  <p className="mt-3 text-white/80 line-clamp-2">{s.message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleHandled(s)}
                    disabled={mToggle.isPending}
                    className={s.handled ? `${btnGhost} ${btnSmall}` : `${btnSuccess} ${btnSmall}`}
                    title={s.handled ? "Mark as unhandled" : "Mark as handled"}
                  >
                    {s.handled ? <X size={14} /> : <Check size={14} />}
                    <span className="hidden sm:inline">{s.handled ? "Undo" : "Handle"}</span>
                  </button>

                  <button
                    onClick={() => onOpenDetails(s)}
                    className={`${btnGhost} ${btnSmall}`}
                    title="View details"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Details</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Delete this suggestion?")) mDelete.mutate(s.id);
                    }}
                    disabled={mDelete.isPending}
                    className={`${btnDanger} ${btnSmall}`}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {open && selected && (
        <Modal onClose={() => setOpen(false)} title="Suggestion Details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KV label="Date" icon={<Calendar size={14} />}>
                {fmtDate(selected.createdAt)}
              </KV>
              <KV label="Status" icon={selected.handled ? <CheckCircle size={14} /> : <XCircle size={14} />}>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selected.handled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {selected.handled ? "Handled" : "Pending"}
                </span>
              </KV>
              <KV label="Name" icon={<User size={14} />}>
                {selected.name || "—"}
              </KV>
              <KV label="Email" icon={<Mail size={14} />}>
                {selected.email || "—"}
              </KV>
            </div>

            <div>
              <div className="text-sm text-white/50 mb-2 flex items-center gap-2">
                <MessageSquare size={14} />
                Message
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 whitespace-pre-wrap text-white/90">
                {selected.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  toggleHandled(selected);
                  setOpen(false);
                }}
                disabled={mToggle.isPending}
                className={selected.handled ? btnGhost : btnSuccess}
              >
                {selected.handled ? <X size={16} /> : <Check size={16} />}
                <span>{selected.handled ? "Mark as unhandled" : "Mark as handled"}</span>
              </button>
              <button className={btnGhost} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Modal Component ---------- */
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
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Key-Value Display ---------- */
function KV({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-white/50 flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="font-medium">{children}</div>
    </div>
  );
}