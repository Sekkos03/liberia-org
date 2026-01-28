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

/* ---------- Helper to build full URL ---------- */
function toFullUrl(url: string | undefined | null): string {
  if (!url) return "";
  // If already absolute URL, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Get the API base URL from environment
  // Priority: VITE_API_URL > VITE_BACKEND_URL > window.location.origin (same-origin fallback)
  const apiBase = 
    import.meta.env.VITE_API_URL || 
    import.meta.env.VITE_BACKEND_URL || 
    (typeof window !== "undefined" ? window.location.origin : "");
  
  // Ensure URL starts with /
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  
  // If we have an API base, use it; otherwise return relative URL
  // This ensures the browser resolves it against the current origin
  return apiBase ? `${apiBase}${normalizedUrl}` : normalizedUrl;
}

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

  // Computed - separate images and videos
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

      {/* Loading state for items */}
      {itemsQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      )}

      {/* Empty state */}
      {!itemsQuery.isLoading && items.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white/80">No media yet</h3>
          <p className="text-white/50 mt-1">Upload some images or videos to get started</p>
        </div>
      )}

      {/* ==================== TWO CATEGORY TABLES ==================== */}
      {!itemsQuery.isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ========== PHOTOS TABLE ========== */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2139] to-[#1a3a5c] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-xl">📷</span>
                </div>
                <h2 className="text-xl font-bold text-white">Photos</h2>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold border border-blue-500/30">
                {images.length}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              {images.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon size={32} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {images.map((item) => (
                    <ImageCard
                      key={item.id}
                      item={item}
                      onDelete={() => {
                        if (confirm("Delete this image?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ========== VIDEOS TABLE ========== */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2139] to-[#1a3a5c] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-xl">🎥</span>
                </div>
                <h2 className="text-xl font-bold text-white">Videos</h2>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold border border-purple-500/30">
                {videos.length}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              {videos.length === 0 ? (
                <div className="text-center py-8">
                  <Film size={32} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/50 text-sm">No videos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {videos.map((item) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      onDelete={() => {
                        if (confirm("Delete this video?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ==================== IMAGE CARD COMPONENT ==================== */
function ImageCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: AdminAlbumItemDTO;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const imageUrl = toFullUrl(item.thumbUrl || item.url);
  
  // Debug logging - remove in production
  console.log("ImageCard rendering:", { 
    id: item.id, 
    originalUrl: item.url, 
    thumbUrl: item.thumbUrl,
    resolvedUrl: imageUrl 
  });

  return (
    <div className="group relative rounded-xl overflow-hidden bg-black/30 border border-white/10 hover:border-blue-500/50 transition-all aspect-square">
      {/* Loading placeholder */}
      {!imgLoaded && !imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 size={20} className="animate-spin text-white/30" />
        </div>
      )}
      
      {/* Error state */}
      {imgError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
          <ImageIcon size={24} className="text-white/30 mb-1" />
          <span className="text-xs text-white/40">Failed to load</span>
          <span className="text-[10px] text-white/30 mt-1 px-2 truncate max-w-full" title={imageUrl}>
            {imageUrl.slice(-40)}
          </span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={item.title || "Photo"}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            console.error("Image load error:", imageUrl, e);
            setImgError(true);
          }}
          crossOrigin="anonymous"
        />
      )}

      {/* Hover overlay with delete button */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          className={`${btnDanger} text-xs px-3 py-1.5 ${isDeleting ? "opacity-50" : ""}`}
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

/* ==================== VIDEO CARD COMPONENT ==================== */
function VideoCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: AdminAlbumItemDTO;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const videoUrl = toFullUrl(item.url);
  const thumbUrl = item.thumbUrl ? toFullUrl(item.thumbUrl) : null;
  
  // Debug logging - remove in production
  console.log("VideoCard rendering:", { 
    id: item.id, 
    originalUrl: item.url, 
    thumbUrl: item.thumbUrl,
    resolvedVideoUrl: videoUrl,
    resolvedThumbUrl: thumbUrl
  });

  return (
    <div className="group relative rounded-xl overflow-hidden bg-black/30 border border-white/10 hover:border-purple-500/50 transition-all aspect-square">
      {/* Loading placeholder */}
      {!videoLoaded && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 size={20} className="animate-spin text-white/30" />
        </div>
      )}

      {/* Error state */}
      {videoError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
          <Film size={24} className="text-white/30 mb-1" />
          <span className="text-xs text-white/40">Failed to load</span>
          <span className="text-[10px] text-white/30 mt-1 px-2 truncate max-w-full" title={videoUrl}>
            {videoUrl.slice(-40)}
          </span>
        </div>
      ) : thumbUrl ? (
        // Show thumbnail if available
        <img
          src={thumbUrl}
          alt={item.title || "Video thumbnail"}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setVideoLoaded(true)}
          onError={(e) => {
            console.error("Video thumbnail load error:", thumbUrl, e);
            setVideoError(true);
          }}
          crossOrigin="anonymous"
        />
      ) : (
        // Show video preview
        <video
          src={videoUrl}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          preload="metadata"
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={(e) => {
            console.error("Video load error:", videoUrl, e);
            setVideoError(true);
          }}
          crossOrigin="anonymous"
        />
      )}

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
          <span className="text-white text-xl ml-1">▶</span>
        </div>
      </div>

      {/* Hover overlay with delete button */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          className={`${btnDanger} text-xs px-3 py-1.5 ${isDeleting ? "opacity-50" : ""}`}
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}