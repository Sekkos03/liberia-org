// admin-web/src/lib/albums.ts
import { http, type Page } from "./events";

/* ----------------------------- Album-typer ----------------------------- */

export type AlbumUpsert = {
  slug?: string;
  title: string;
  description?: string | null;
  coverPhotoId?: number | null;
  published?: boolean;
};

export type AlbumDTO = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  eventId?: number | null;
  eventTitle?: string | null;
};

/* ----------------------------- Upload Config ----------------------------- */

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
  "video/3gpp",
  "video/3gpp2",
];

export const SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES];

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB for images
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos
export const MAX_TOTAL_UPLOAD_SIZE = 2 * 1024 * 1024 * 1024; // 2GB total per request

// Upload timeout (in milliseconds) - 10 minutes
export const UPLOAD_TIMEOUT = 10 * 60 * 1000;

/* ----------------------------- Validation ----------------------------- */

export type FileValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateFile(file: File): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type by MIME or extension
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
  const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);

  // Fallback: check by extension
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
  const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "3gp", "3g2"];
  const isImageByExt = imageExts.includes(ext);
  const isVideoByExt = videoExts.includes(ext);

  if (!isImage && !isVideo && !isImageByExt && !isVideoByExt) {
    errors.push(
      `Unsupported file type: ${file.type || "unknown"}. ` +
        `Supported: Images (JPEG, PNG, GIF, WebP, HEIC) and Videos (MP4, WebM, MOV, AVI, MKV).`
    );
  } else if (!isImage && !isVideo && (isImageByExt || isVideoByExt)) {
    warnings.push(`File type "${file.type}" not recognized, but extension .${ext} looks valid.`);
  }

  // Determine if video for size check
  const treatAsVideo = isVideo || isVideoByExt;
  const maxSize = treatAsVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const maxSizeMB = maxSize / (1024 * 1024);

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(
      `File "${file.name}" is too large (${fileSizeMB}MB). ` +
        `Maximum size for ${treatAsVideo ? "videos" : "images"} is ${maxSizeMB}MB.`
    );
  }

  // Warn for large files
  if (file.size > maxSize * 0.8 && file.size <= maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    warnings.push(`File "${file.name}" is ${fileSizeMB}MB. Large files may take longer to upload.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateFiles(files: File[]): FileValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Check total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
    const maxSizeMB = (MAX_TOTAL_UPLOAD_SIZE / (1024 * 1024)).toFixed(0);
    allErrors.push(`Total upload size (${totalSizeMB}MB) exceeds maximum (${maxSizeMB}MB).`);
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/* ------------------------------ Hjelpere ------------------------------- */

function unwrap<T = any>(data: any, embeddedKey?: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.content)) return data.content as T[];
  if (embeddedKey && Array.isArray(data?._embedded?.[embeddedKey])) {
    return data._embedded[embeddedKey] as T[];
  }
  return [];
}

function slugify(input: string): string {
  const s = (input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return s || "album";
}

function normalizeAlbum(a: any): AlbumDTO {
  return {
    id: Number(a?.id ?? a?.albumId),
    slug: a?.slug ?? String(a?.id ?? ""),
    title: a?.title ?? a?.name ?? "Album",
    description: a?.description ?? null,
    published: Boolean(a?.published ?? a?.isPublished ?? false),
    createdAt: a?.createdAt ?? null,
    updatedAt: a?.updatedAt ?? null,
    eventId: a?.eventId ?? a?.event?.id ?? null,
    eventTitle: a?.eventTitle ?? a?.event?.title ?? null,
  };
}

/* -------------------------- Album CRUD (admin) ------------------------- */

export async function listAlbumsAdmin(): Promise<Page<AlbumDTO> | AlbumDTO[]> {
  const res = await http.get(`/api/admin/albums`);
  const rows = unwrap(res.data, "albums").map(normalizeAlbum);

  if (Array.isArray(res.data?.content)) {
    return { ...(res.data as any), content: rows } as Page<AlbumDTO>;
  }
  return rows;
}

export async function createAlbum(body: AlbumUpsert): Promise<AlbumDTO> {
  const title = (body.title || "").trim();
  if (!title) throw new Error("Title is required");

  const slug = (body.slug || "").trim();
  const payload: any = {
    title,
    description: body.description ?? null,
    ...(typeof body.published === "boolean" ? { published: body.published } : {}),
    ...(slug ? { slug: slugify(slug) } : {}),
  };

  const res = await http.post(`/api/admin/albums`, payload);
  return normalizeAlbum(res.data);
}

export async function updateAlbum(id: number, body: Partial<AlbumUpsert>): Promise<AlbumDTO> {
  const payload: any = { ...body };

  if (typeof payload.title === "string") payload.title = payload.title.trim();

  if (typeof payload.slug === "string") {
    const s = payload.slug.trim();
    payload.slug = s ? slugify(s) : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "published")) {
    payload.published = Boolean(payload.published);
    delete payload.isPublished;
  }

  const res = await http.put(`/api/admin/albums/${id}`, payload);
  return normalizeAlbum(res.data);
}

export async function setAlbumPublished(id: number, value: boolean): Promise<AlbumDTO> {
  const res = await http.put(`/api/admin/albums/${id}`, { published: value });
  return normalizeAlbum(res.data);
}

export async function deleteAlbum(id: number): Promise<void> {
  await http.delete(`/api/admin/albums/${id}`);
}

export async function getAlbumAdmin(id: number): Promise<AlbumDTO> {
  const res = await http.get(`/api/admin/albums/${id}`);
  return normalizeAlbum(res.data);
}

/* -------------------------- Album media (admin) ------------------------ */

export type AdminAlbumItemDTO = {
  id: number;
  title?: string | null;
  kind: "IMAGE" | "VIDEO";
  url: string;
  thumbUrl?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
};

const videoExt = /\.(mp4|webm|ogg|mkv|mov|avi|3gp|3g2)$/i;

const normUrl = (u?: string | null): string | undefined => {
  if (!u) return undefined;
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
};

function normalizeAdminItem(it: any): AdminAlbumItemDTO {
  const fromFileName = it?.fileName ? `/uploads/media2/${String(it.fileName)}` : undefined;

  const url: string =
    normUrl(it?.url) ??
    normUrl(it?.mediaUrl) ??
    normUrl(it?.imageUrl) ??
    normUrl(it?.videoUrl) ??
    normUrl(fromFileName) ??
    normUrl(it?.path) ??
    "";

  const ct = String(it?.contentType ?? "");
  const looksVideo =
    ct.toLowerCase().startsWith("video/") || videoExt.test(url) || !!it?.videoUrl || it?.kind === "VIDEO";

  return {
    id: Number(it?.id ?? it?.itemId),
    title: it?.title ?? null,
    kind: looksVideo ? "VIDEO" : "IMAGE",
    url,
    thumbUrl: normUrl(it?.thumbUrl ?? it?.thumbnailUrl ?? it?.thumbnail) ?? null,
    contentType: it?.contentType ?? null,
    sizeBytes: it?.sizeBytes ?? it?.size ?? null,
    createdAt: it?.createdAt ?? null,
  };
}

export async function listAlbumItemsAdmin(albumId: number): Promise<AdminAlbumItemDTO[]> {
  const res = await http.get(`/api/admin/albums/${albumId}/items`);
  return unwrap(res.data, "items").map(normalizeAdminItem);
}

/* -------------------------- Upload with Progress ------------------------ */

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
  currentFile?: string;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
};

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Get auth token from localStorage or sessionStorage
 */
function getAuthToken(): string | null {
  // Try common token storage locations
  const token = 
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");
  
  return token;
}

/**
 * Upload album items with progress tracking using XMLHttpRequest
 * This is more reliable than axios for large file uploads with progress
 */
export async function uploadAlbumItemsAdmin(
  albumId: number,
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<AdminAlbumItemDTO[]> {
  // Validate files first
  const validation = validateFiles(files);
  if (!validation.valid) {
    const error = validation.errors.join("\n");
    onProgress?.({
      loaded: 0,
      total: 0,
      percentage: 0,
      status: "error",
      error,
    });
    throw new Error(error);
  }

  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn("Upload warnings:", validation.warnings);
  }

  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  // Get base URL from axios instance
  const baseURL = http.defaults.baseURL || "";
  
  // Get auth token
  const token = getAuthToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percentage,
          status: percentage >= 100 ? "processing" : "uploading",
          currentFile: files[0]?.name,
        });
      }
    });

    // Handle successful completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onProgress?.({
            loaded: totalSize,
            total: totalSize,
            percentage: 100,
            status: "complete",
          });
          resolve(unwrap(data, "items").map(normalizeAdminItem));
        } catch (e) {
          console.error("Failed to parse response:", xhr.responseText);
          reject(new Error("Failed to parse server response"));
        }
      } else {
        let errorMessage = `Upload failed (${xhr.status})`;
        try {
          const errorData = JSON.parse(xhr.responseText);
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch {
          if (xhr.status === 413) {
            errorMessage = "File too large. Please reduce the file size or upload fewer files at once.";
          } else if (xhr.status === 415) {
            errorMessage = "Unsupported file format.";
          } else if (xhr.status === 401) {
            errorMessage = "Authentication required. Please log in again.";
          } else if (xhr.status === 403) {
            errorMessage = "Permission denied.";
          } else if (xhr.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }
        onProgress?.({
          loaded: 0,
          total: totalSize,
          percentage: 0,
          status: "error",
          error: errorMessage,
        });
        reject(new Error(errorMessage));
      }
    });

    // Handle network errors
    xhr.addEventListener("error", () => {
      const errorMessage = "Network error. Please check your connection and try again.";
      onProgress?.({
        loaded: 0,
        total: totalSize,
        percentage: 0,
        status: "error",
        error: errorMessage,
      });
      reject(new Error(errorMessage));
    });

    // Handle timeout
    xhr.addEventListener("timeout", () => {
      const errorMessage = "Upload timed out. The file may be too large or the connection is slow.";
      onProgress?.({
        loaded: 0,
        total: totalSize,
        percentage: 0,
        status: "error",
        error: errorMessage,
      });
      reject(new Error(errorMessage));
    });

    // Handle abort
    xhr.addEventListener("abort", () => {
      onProgress?.({
        loaded: 0,
        total: totalSize,
        percentage: 0,
        status: "error",
        error: "Upload cancelled",
      });
      reject(new Error("Upload cancelled"));
    });

    // Set initial progress
    onProgress?.({
      loaded: 0,
      total: totalSize,
      percentage: 0,
      status: "uploading",
      currentFile: files[0]?.name,
    });

    // Open connection
    xhr.open("POST", `${baseURL}/api/admin/albums/${albumId}/items`);
    xhr.timeout = UPLOAD_TIMEOUT;

    // Set auth header if token exists
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Send the request - don't set Content-Type, browser will set it with boundary
    xhr.send(fd);
  });
}

/**
 * Upload files one by one (for very large files or unreliable connections)
 */
export async function uploadAlbumItemsOneByOne(
  albumId: number,
  files: File[],
  onProgress?: (progress: UploadProgress & { fileIndex: number; totalFiles: number }) => void
): Promise<AdminAlbumItemDTO[]> {
  const results: AdminAlbumItemDTO[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Validate single file
    const validation = validateFile(file);
    if (!validation.valid) {
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: "error",
        error: validation.errors.join("\n"),
        currentFile: file.name,
        fileIndex: i,
        totalFiles,
      });
      continue; // Skip invalid files but continue with others
    }

    try {
      const items = await uploadAlbumItemsAdmin(albumId, [file], (progress) => {
        onProgress?.({
          ...progress,
          fileIndex: i,
          totalFiles,
        });
      });
      results.push(...items);
    } catch (error: any) {
      console.error(`Failed to upload ${file.name}:`, error);
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: "error",
        error: error.message || `Failed to upload ${file.name}`,
        currentFile: file.name,
        fileIndex: i,
        totalFiles,
      });
    }
  }

  return results;
}

export async function deleteAlbumItemAdmin(albumId: number, itemId: number): Promise<void> {
  await http.delete(`/api/admin/albums/${albumId}/items/${itemId}`);
}

/* -------------------------- Utility Functions -------------------------- */

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get file type category
 */
export function getFileCategory(file: File): "image" | "video" | "unknown" {
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return "image";
  if (SUPPORTED_VIDEO_TYPES.includes(file.type)) return "video";

  // Fallback to extension
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
  const videoExts = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "3gp", "3g2"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";

  return "unknown";
}