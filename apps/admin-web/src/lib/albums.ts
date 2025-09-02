// admin-web/src/lib/albums.ts
// API for albums & photos (ADMIN)

import axios from "axios";

/* ------------------------------- HTTP client ------------------------------- */
const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8080";

function getToken(): string | null {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    null
  );
}

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Add Authorization header automatically
http.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers["Authorization"] = t.startsWith("Bearer ") ? t : `Bearer ${t}`;
  }
  return cfg;
});

// On 401, clear token and send to login
http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      if (!location.pathname.includes("/login")) location.assign("/login");
    }
    return Promise.reject(err);
  }
);

/* ---------------------------------- Types --------------------------------- */
export type AlbumDTO = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  published: boolean;
  coverPhotoId?: number | null;
  coverUrl?: string | null;
  photoCount: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type PhotoDTO = {
  id: number;
  url: string;
  caption?: string | null;
  contentType?: string | null;
  sizeBytes: number;
  sortOrder: number;
  published: boolean;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type AlbumUpsert = {
  slug: string;
  title: string;
  description?: string | null;
  published?: boolean;
};

/* --------------------------------- Auth ----------------------------------- */
export async function login(username: string, password: string): Promise<void> {
  const res = await http.post<{ token: string }>("/api/auth/login", {
    username,
    password,
  });
  const tok = res.data.token;
  localStorage.setItem(
    "auth_token",
    tok.startsWith("Bearer ") ? tok.slice(7) : tok
  );
}

/* --------------------------- Albums (admin) API ---------------------------- */
export async function listAdminAlbums(
  page = 0,
  size = 50
): Promise<Page<AlbumDTO>> {
  const { data } = await http.get<Page<AlbumDTO>>("/api/admin/albums", {
    params: { page, size },
  });
  return data;
}

export async function getAdminAlbum(
  id: number
): Promise<{ album: AlbumDTO; photos: PhotoDTO[] }> {
  const { data } = await http.get<{ album: AlbumDTO; photos: PhotoDTO[] }>(
    `/api/admin/albums/${id}`
  );
  return data;
}

export async function createAlbum(body: AlbumUpsert): Promise<AlbumDTO> {
  const { data } = await http.post<AlbumDTO>("/api/admin/albums", body);
  return data;
}

export async function updateAlbum(
  id: number,
  body: Partial<AlbumUpsert>
): Promise<AlbumDTO> {
  const { data } = await http.put<AlbumDTO>(`/api/admin/albums/${id}`, body);
  return data;
}

export async function deleteAlbum(id: number): Promise<void> {
  await http.delete(`/api/admin/albums/${id}`);
}

export async function setAlbumPublished(
  id: number,
  value: boolean
): Promise<void> {
  await http.patch(`/api/admin/albums/${id}/published`, { published: value });
}

/* --------------------------- Photos (admin) API ---------------------------- */
export async function uploadPhotos(
  albumId: number,
  files: File[]
): Promise<{ uploaded: number }> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const { data } = await http.post<{ uploaded: number }>(
    `/api/admin/albums/${albumId}/photos`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function setCoverPhoto(
  albumId: number,
  photoId: number
): Promise<void> {
  await http.patch(`/api/admin/albums/${albumId}/cover`, { photoId });
}

export async function deletePhoto(
  albumId: number,
  photoId: number
): Promise<void> {
  await http.delete(`/api/admin/albums/${albumId}/photos/${photoId}`);
}
