import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listAlbumsAdmin,
  createAlbum,
  deleteAlbum,
  setAlbumPublished,
  updateAlbum,
  type AlbumDTO,
  type AlbumUpsert,
} from "../../lib/albums";
import { Images, Plus, Pencil, Trash2, Eye, EyeOff, FolderOpen, X } from "lucide-react";

/* ---------- Style constants ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5`;
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white px-3 py-2`;
const btnSmall = "px-2.5 py-1.5 text-sm";
const inputBase = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-white/40";

type ModalMode = "create" | "edit";

function emptyForm(): AlbumUpsert {
  return { slug: "", title: "", description: "", published: false };
}

export default function AdminAlbums() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminAlbums"], queryFn: () => listAlbumsAdmin() });

  const mCreate = useMutation({
    mutationFn: (payload: AlbumUpsert) => createAlbum(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  const mUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AlbumUpsert> }) => updateAlbum(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  const mDelete = useMutation({
    mutationFn: (id: number) => deleteAlbum(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  const mPublish = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => setAlbumPublished(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbums"] }),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AlbumUpsert>(emptyForm());
  const [err, setErr] = useState<string | null>(null);

  const rows: AlbumDTO[] = useMemo(() => {
    const raw: any = q.data;
    const list: AlbumDTO[] = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    return list.slice().sort((a, b) => {
      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      return db - da;
    });
  }, [q.data]);

  function openCreate() {
    setErr(null);
    setMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(a: AlbumDTO) {
    setErr(null);
    setMode("edit");
    setEditingId(a.id);
    setForm({
      slug: a.slug ?? "",
      title: a.title ?? "",
      description: a.description ?? "",
      published: a.published,
    });
    setModalOpen(true);
  }

  function togglePublished(a: AlbumDTO) {
    setErr(null);
    mPublish.mutate({ id: a.id, value: !a.published });
  }

  async function submit() {
    setErr(null);

    const title = (form.title || "").trim();
    if (!title) {
      setErr("Title is required.");
      return;
    }

    try {
      if (mode === "create") {
        await mCreate.mutateAsync({
          title,
          slug: form.slug ?? "",
          description: form.description ?? "",
          published: Boolean(form.published),
        });
      } else {
        if (!editingId) {
          setErr("Missing album ID for editing.");
          return;
        }
        await mUpdate.mutateAsync({
          id: editingId,
          payload: {
            title,
            slug: form.slug ?? "",
            description: form.description ?? "",
            published: Boolean(form.published),
          },
        });
      }

      setModalOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      setMode("create");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Something went wrong.";
      setErr(String(msg));
    }
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
        Failed to load albums. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Albums</h1>
          <p className="text-white/60 text-sm mt-1">Manage your photo and video albums</p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={18} />
          <span>New album</span>
        </button>
      </div>

      {/* Albums Grid */}
      {rows.length === 0 ? (
        <div className="text-center py-12">
          <Images size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white/80">No albums yet</h3>
          <p className="text-white/50 mt-1">Create your first album to get started</p>
          <button onClick={openCreate} className={`${btnPrimary} mt-4`}>
            <Plus size={18} />
            <span>Create album</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((a) => (
            <div
              key={a.id}
              className="group rounded-2xl border border-white/10 bg-[rgba(10,18,36,0.5)] overflow-hidden hover:border-white/20 transition-all duration-300"
            >
              {/* Card Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Images size={20} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg truncate">{a.title}</h3>
                      <p className="text-sm text-white/50">@{a.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      a.published
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {a.published ? <Eye size={12} /> : <EyeOff size={12} />}
                    {a.published ? "Published" : "Draft"}
                  </span>
                </div>

                {a.description && (
                  <p className="mt-3 text-sm text-white/70 line-clamp-2">{a.description}</p>
                )}
              </div>

              {/* Card Actions */}
              <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-2">
                <Link
                  to={`/admin/albums/${a.id}`}
                  className={`${btnGhost} ${btnSmall} flex-1`}
                >
                  <FolderOpen size={14} />
                  <span>Open</span>
                </Link>

                <button
                  onClick={() => openEdit(a)}
                  className={`${btnGhost} ${btnSmall}`}
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>

                <button
                  onClick={() => togglePublished(a)}
                  disabled={mPublish.isPending}
                  className={`${btnGhost} ${btnSmall}`}
                  title={a.published ? "Unpublish" : "Publish"}
                >
                  {a.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete album "${a.title}"?`)) mDelete.mutate(a.id);
                  }}
                  disabled={mDelete.isPending}
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-xl font-bold">
                {mode === "create" ? "New album" : "Edit album"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {err && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                  {err}
                </div>
              )}

              <label className="block space-y-1.5">
                <span className="text-sm text-white/70">Title *</span>
                <input
                  className={inputBase}
                  placeholder="Album title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm text-white/70">Slug (optional)</span>
                <input
                  className={inputBase}
                  placeholder="e.g. founders-day"
                  value={form.slug ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <p className="text-xs text-white/40 mt-1">URL-friendly identifier. Leave empty to auto-generate.</p>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm text-white/70">Description (optional)</span>
                <textarea
                  rows={3}
                  className={`${inputBase} resize-y`}
                  placeholder="Brief description of the album"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>

              <label className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.published)}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/30"
                />
                <span className="text-white/80">Publish immediately</span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
              <button className={btnGhost} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button
                className={btnPrimary}
                onClick={submit}
                disabled={mCreate.isPending || mUpdate.isPending}
              >
                {mCreate.isPending || mUpdate.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{mode === "create" ? "Create album" : "Save changes"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}