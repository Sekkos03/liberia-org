import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAlbumAdmin,
  listAlbumItemsAdmin,
  uploadAlbumItemsAdmin,
  deleteAlbumItemAdmin,
  type AdminAlbumItemDTO,
} from "../../lib/albums";
import { pickImageSrc, toPublicUrl, isVideo } from "../../lib/media";
import { ArrowLeft, Upload, Image, Video, Trash2, X, Play, Images } from "lucide-react";

/* ---------- Style constants ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5`;
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white`;
const btnSmall = "px-2.5 py-1.5 text-sm";
const cardBase = "rounded-2xl border border-white/10 bg-[rgba(10,18,36,0.5)]";

export default function AdminAlbumDetail() {
  const { id = "" } = useParams();
  const albumId = Number(id);
  const qc = useQueryClient();

  const metaQ = useQuery({
    queryKey: ["adminAlbum.meta", albumId],
    queryFn: () => getAlbumAdmin(albumId),
    enabled: Number.isFinite(albumId),
  });

  const itemsQ = useQuery({
    queryKey: ["adminAlbum.items", albumId],
    queryFn: () => listAlbumItemsAdmin(albumId),
    enabled: Number.isFinite(albumId),
  });

  const items = itemsQ.data ?? [];
  const images = useMemo(() => items.filter((x) => x.kind === "IMAGE"), [items]);
  const videos = useMemo(() => items.filter((x) => x.kind === "VIDEO"), [items]);

  const [preview, setPreview] = useState<AdminAlbumItemDTO | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mUpload = useMutation({
    mutationFn: (files: File[]) => uploadAlbumItemsAdmin(albumId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbum.items", albumId] }),
  });

  const mDelete = useMutation({
    mutationFn: (itemId: number) => deleteAlbumItemAdmin(albumId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAlbum.items", albumId] }),
  });

  // Handle escape key for lightbox
  useEffect(() => {
    if (!preview) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [preview]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length) mUpload.mutate(files);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            to="/albums"
            className="mt-1 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition shrink-0"
            title="Back to albums"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {metaQ.data?.title ?? "Album"}
            </h1>
            <p className="text-white/50 text-sm">@{metaQ.data?.slug ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
            {images.length} images
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
            {videos.length} videos
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div
        className={`${cardBase} p-6 transition-all duration-300 ${
          isDragging ? "border-indigo-500 bg-indigo-500/10" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Upload size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold">Upload media</h2>
              <p className="text-sm text-white/50">Drag and drop or click to select files</p>
            </div>
          </div>
          <label className={`${btnPrimary} cursor-pointer`}>
            <Upload size={16} />
            <span>Select files</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) mUpload.mutate(files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {mUpload.isPending && (
          <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
            <div className="w-4 h-4 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            <span>Uploading files...</span>
          </div>
        )}

        {isDragging && (
          <div className="mt-4 p-8 border-2 border-dashed border-indigo-500/50 rounded-xl text-center">
            <Upload size={32} className="mx-auto text-indigo-400 mb-2" />
            <p className="text-indigo-300">Drop files here to upload</p>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images Section */}
        <div className={`${cardBase} overflow-hidden`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Image size={18} className="text-white/60" />
              <h3 className="font-semibold">Images</h3>
            </div>
            <span className="text-sm text-white/50 px-2 py-0.5 rounded-md bg-white/5">
              {images.length}
            </span>
          </div>

          <div className="p-4">
            {itemsQ.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <Image size={32} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/50 text-sm">No images uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((it) => (
                  <div key={it.id} className="group relative">
                    <button
                      className="block w-full aspect-square overflow-hidden rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300"
                      onClick={() => setPreview(it)}
                    >
                      <img
                        src={pickImageSrc(it.thumbUrl ?? null, it.url)}
                        alt={it.title ?? ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                    <button
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      onClick={() => {
                        if (confirm("Delete this image?")) mDelete.mutate(it.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Videos Section */}
        <div className={`${cardBase} overflow-hidden`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-white/60" />
              <h3 className="font-semibold">Videos</h3>
            </div>
            <span className="text-sm text-white/50 px-2 py-0.5 rounded-md bg-white/5">
              {videos.length}
            </span>
          </div>

          <div className="p-4">
            {itemsQ.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8">
                <Video size={32} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/50 text-sm">No videos uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videos.map((it) => (
                  <div key={it.id} className="group relative">
                    <button
                      className="block w-full aspect-video overflow-hidden rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300"
                      onClick={() => setPreview(it)}
                    >
                      <video
                        src={toPublicUrl(it.url)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play size={20} className="text-white ml-1" />
                        </div>
                      </div>
                    </button>
                    <button
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      onClick={() => {
                        if (confirm("Delete this video?")) mDelete.mutate(it.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!itemsQ.isLoading && images.length === 0 && videos.length === 0 && (
        <div className={`${cardBase} p-8 text-center`}>
          <Images size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white/80">No media in this album</h3>
          <p className="text-white/50 mt-1 mb-4">Upload images or videos to get started</p>
          <label className={`${btnPrimary} cursor-pointer inline-flex`}>
            <Upload size={16} />
            <span>Upload media</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) mUpload.mutate(files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition z-10"
            onClick={() => setPreview(null)}
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Media */}
          <div
            className="max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.kind === "VIDEO" || isVideo(preview.url) ? (
              <video
                src={toPublicUrl(preview.url)}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={toPublicUrl(preview.url)}
                alt={preview.title ?? ""}
                className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
              />
            )}
          </div>

          {/* Title */}
          {preview.title && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm text-white/90">
              {preview.title}
            </div>
          )}
        </div>
      )}
    </div>
  );
}