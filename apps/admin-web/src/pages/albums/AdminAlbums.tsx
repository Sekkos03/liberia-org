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

const badgeBase = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
const badgeYes = badgeBase + " bg-green-900/30 text-green-300 border border-green-700/40";
const badgeNo = badgeBase + " bg-zinc-800 text-zinc-300 border border-white/10";

const btn = "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold border";
const btnGhost = btn + " bg-transparent text-white/90 border-white/15 hover:bg-white/5";
const btnDanger = btn + " bg-red-600/90 text-white border-red-600/70 hover:bg-red-600";
const btnPrimary = btn + " bg-indigo-600/95 text-white border-indigo-500 hover:bg-indigo-600";

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
    // Sort newest first if createdAt exists
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
      setErr("Tittel er påkrevd.");
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
          setErr("Mangler album-id for redigering.");
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
        "Noe gikk galt.";
      setErr(String(msg));
    }
  }

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-400">Kunne ikke laste album.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Albums</h1>
        <button className={btnPrimary} onClick={openCreate}>
          Nytt album
        </button>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((a) => (
          <li key={a.id} className="rounded-xl border border-white/10 bg-[rgba(10,18,36,.65)] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold">{a.title}</div>
                <div className="text-white/70">@{a.slug}</div>
              </div>
              <span className={a.published ? badgeYes : badgeNo}>
                {a.published ? "Publisert" : "Utkast"}
              </span>
            </div>

            {a.description && <p className="mt-2 text-white/80">{a.description}</p>}

            <div className="flex flex-wrap items-center gap-2 pt-3">
              <Link to={`/admin/albums/${a.id}`} className={btnGhost}>
                Åpne
              </Link>

              <button className={btnGhost} onClick={() => openEdit(a)}>
                Rediger
              </button>

              <button className={btnGhost} onClick={() => togglePublished(a)} disabled={mPublish.isPending}>
                {a.published ? "Unpublish" : "Publish"}
              </button>

              <button
                className={btnDanger}
                onClick={() => {
                  if (confirm(`Slette album “${a.title}”?`)) mDelete.mutate(a.id);
                }}
                disabled={mDelete.isPending}
              >
                Slett
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50" onClick={() => setModalOpen(false)}>
          <div
            className="bg-[#0b1527] border border-white/15 rounded-xl p-5 w-[min(680px,92vw)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">{mode === "create" ? "Nytt album" : "Rediger album"}</h2>
              <button className={btnGhost} onClick={() => setModalOpen(false)}>
                Lukk
              </button>
            </div>

            {err && (
              <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">
                {err}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-white/70">Slug (valgfritt)</span>
                <input
                  className="rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
                  placeholder="f.eks founders-day (kan være tom)"
                  value={form.slug ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-white/70">Tittel *</span>
                <input
                  className="rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>

              <label className="grid gap-1 md:col-span-2">
                <span className="text-sm text-white/70">Beskrivelse (valgfritt)</span>
                <textarea
                  rows={4}
                  className="rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>

              <label className="flex items-center gap-2 md:col-span-2 pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(form.published)}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                <span className="text-sm text-white/80">Publisert</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button className={btnGhost} onClick={() => setModalOpen(false)}>
                Avbryt
              </button>

              <button
                className={btnPrimary}
                onClick={submit}
                disabled={mCreate.isPending || mUpdate.isPending}
              >
                {mode === "create" ? "Opprett album" : "Lagre endringer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
