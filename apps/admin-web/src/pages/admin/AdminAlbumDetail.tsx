import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAlbumAdmin,
  listAlbumItemsAdmin,
  uploadAlbumItemsAdmin,
  uploadAlbumItemsOneByOne,
  deleteAlbumItemAdmin,
  validateFiles,
  formatFileSize,
  getFileCategory,
  SUPPORTED_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  type AdminAlbumItemDTO,
  type UploadProgress,
} from "../../lib/albums";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Image as ImageIcon,
  Film,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileWarning,
} from "lucide-react";

/* ---------- Style constants ---------- */
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5`;
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white px-3 py-2`;

export default function AdminAlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const albumId = Number(id);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadMode, setUploadMode] = useState<"batch" | "sequential">("batch");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showDropzone, setShowDropzone] = useState(false);

  // Queries
  const albumQuery = useQuery({
    queryKey: ["adminAlbum", albumId],
    queryFn: () => getAlbumAdmin(albumId),
    enabled: !isNaN(albumId),
  });

  const itemsQuery = useQuery({
    queryKey: ["adminAlbumItems", albumId],
    queryFn: () => listAlbumItemsAdmin(albumId),
    enabled: !isNaN(albumId),
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (uploadMode === "sequential") {
        return uploadAlbumItemsOneByOne(albumId, files, (progress) => {
          setUploadProgress({
            ...progress,
            currentFile: `${progress.fileIndex + 1}/${progress.totalFiles}: ${progress.currentFile}`,
          });
        });
      } else {
        return uploadAlbumItemsAdmin(albumId, files, setUploadProgress);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminAlbumItems", albumId] });
      setSelectedFiles([]);
      setUploadProgress(null);
      setValidationErrors([]);
      setValidationWarnings([]);
    },
    onError: (error: any) => {
      setUploadProgress((prev) =>
        prev ? { ...prev, status: "error", error: error.message } : null
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => deleteAlbumItemAdmin(albumId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminAlbumItems", albumId] });
    },
  });

  // Handlers
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validation = validateFiles(fileArray);

    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);

    if (validation.valid) {
      setSelectedFiles(fileArray);
    } else {
      setSelectedFiles([]);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setShowDropzone(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setShowDropzone(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setShowDropzone(false);
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  }, [selectedFiles, uploadMutation]);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setValidationErrors([]);
    setValidationWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Computed
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const images = useMemo(() => items.filter((i) => i.kind === "IMAGE"), [items]);
  const videos = useMemo(() => items.filter((i) => i.kind === "VIDEO"), [items]);

  const totalSelectedSize = useMemo(
    () => selectedFiles.reduce((sum, f) => sum + f.size, 0),
    [selectedFiles]
  );

  const hasLargeFiles = useMemo(
    () => selectedFiles.some((f) => f.size > 100 * 1024 * 1024),
    [selectedFiles]
  );

  // Loading state
  if (albumQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (albumQuery.isError || !albumQuery.data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Failed to load album. Please try again.
      </div>
    );
  }

  const album = albumQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/albums" className={btnGhost}>
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{album.title}</h1>
            <p className="text-white/60 text-sm mt-1">@{album.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">
            {images.length} images, {videos.length} videos
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div
        className={`rounded-2xl border-2 border-dashed transition-all duration-300 ${
          showDropzone
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/20 bg-white/5"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORTED_TYPES.join(",")}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
          />

          {selectedFiles.length === 0 ? (
            <>
              <Upload className="w-12 h-12 mx-auto text-white/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Images: JPEG, PNG, GIF, WebP, HEIC (max {MAX_IMAGE_SIZE / 1024 / 1024}MB)
                <br />
                Videos: MP4, WebM, MOV, AVI, MKV (max {MAX_VIDEO_SIZE / 1024 / 1024}MB)
              </p>
              <label htmlFor="file-upload" className={`${btnPrimary} cursor-pointer`}>
                <Upload size={18} />
                <span>Select Files</span>
              </label>
            </>
          ) : (
            <div className="space-y-4">
              {/* Selected files list */}
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedFiles.map((file, idx) => {
                  const category = getFileCategory(file);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm"
                    >
                      {category === "image" ? (
                        <ImageIcon size={16} className="text-blue-400" />
                      ) : category === "video" ? (
                        <Film size={16} className="text-purple-400" />
                      ) : (
                        <FileWarning size={16} className="text-yellow-400" />
                      )}
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <span className="text-white/50">{formatFileSize(file.size)}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-white/60 text-sm">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
                ({formatFileSize(totalSelectedSize)})
              </p>

              {/* Upload mode toggle for large files */}
              {hasLargeFiles && (
                <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertCircle size={18} className="text-amber-400" />
                  <span className="text-amber-300 text-sm">
                    Large files detected. Sequential upload recommended for reliability.
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadMode === "sequential"}
                      onChange={(e) =>
                        setUploadMode(e.target.checked ? "sequential" : "batch")
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-white/80">Sequential</span>
                  </label>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3">
                <button onClick={clearSelection} className={btnGhost}>
                  <X size={18} />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className={btnPrimary}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {uploadProgress && uploadProgress.status !== "complete" && (
          <div className="px-6 pb-6">
            <div className="rounded-lg bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {uploadProgress.status === "uploading" && "Uploading..."}
                  {uploadProgress.status === "processing" && "Processing..."}
                  {uploadProgress.status === "error" && "Upload failed"}
                </span>
                <span className="text-sm text-white/60">
                  {uploadProgress.percentage}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    uploadProgress.status === "error"
                      ? "bg-red-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>

              {uploadProgress.currentFile && (
                <p className="text-xs text-white/50 mt-2 truncate">
                  {uploadProgress.currentFile}
                </p>
              )}

              {uploadProgress.status === "error" && uploadProgress.error && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300">{uploadProgress.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success message */}
        {uploadProgress?.status === "complete" && (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle size={20} className="text-emerald-400" />
              <span className="text-emerald-300">Upload completed successfully!</span>
            </div>
          </div>
        )}
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-red-300 mb-2">Cannot upload files</h4>
              <ul className="space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="text-sm text-red-300/80">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation warnings */}
      {validationWarnings.length > 0 && validationErrors.length === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-300 mb-2">Warnings</h4>
              <ul className="space-y-1">
                {validationWarnings.map((warn, idx) => (
                  <li key={idx} className="text-sm text-amber-300/80">
                    {warn}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {itemsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white/80">No media yet</h3>
          <p className="text-white/50 mt-1">Upload some images or videos to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onDelete={() => {
                if (confirm("Delete this item?")) {
                  deleteMutation.mutate(item.id);
                }
              }}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Media Card Component ---------- */
function MediaCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: AdminAlbumItemDTO;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="aspect-square">
        {item.kind === "VIDEO" ? (
          <div className="w-full h-full bg-purple-900/20 flex items-center justify-center relative">
            <video
              src={item.url}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                <Film size={20} className="text-white" />
              </div>
            </div>
          </div>
        ) : imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ImageIcon size={24} className="text-white/30" />
          </div>
        ) : (
          <img
            src={item.thumbUrl || item.url}
            alt={item.title || "Media"}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Overlay with delete button */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className={`${btnDanger} ${isDeleting ? "opacity-50" : ""}`}
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {/* Type badge */}
      <div className="absolute top-2 left-2">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            item.kind === "VIDEO"
              ? "bg-purple-500/80 text-white"
              : "bg-blue-500/80 text-white"
          }`}
        >
          {item.kind === "VIDEO" ? "Video" : "Image"}
        </span>
      </div>
    </div>
  );
}