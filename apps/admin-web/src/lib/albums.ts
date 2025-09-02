// admin-web/src/lib/albums.ts
import { http, type Page } from "./api";

/* ---------------------------------- Types --------------------------------- */

export type AlbumDTO = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  coverPhotoId?: number | null;
  published: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type AlbumUpsert = {
  slug: string;
  title: string;
  description?: string | null;
  coverPhotoId?: number | null;
  published?: boolean;
};

export type PhotoDTO = {
  id: number;
  albumId: number;
  originalName: string;
  fileName: string;
  contentType?: string | null;
  sizeBytes: number;
  url: string;
  caption?: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

/* ------------------------------ Admin endpoints --------------------------- */

export async function listAlbumsAdmin(
  page = 0,
  size = 20
): Promise<Page<AlbumDTO>> {
  const res = await http.get<Page<AlbumDTO>>("/api/admin/albums", {
    params: { page, size },
  });
  return res.data;
}

export async function createAlbum(body: AlbumUpsert): Promise<AlbumDTO> {
  const res = await http.post<AlbumDTO>("/api/admin/albums", body);
  return res.data;
}

export async function updateAlbum(
  id: number,
  body: AlbumUpsert
): Promise<AlbumDTO> {
  const res = await http.put<AlbumDTO>(`/api/admin/albums/${id}`, body);
  return res.data;
}

export async function deleteAlbum(id: number): Promise<void> {
  await http.delete(`/api/admin/albums/${id}`);
}

export async function setAlbumPublished(
  id: number,
  value: boolean
): Promise<void> {
  // Viktig: /published (ikke /publish) og JSON-body
  await http.patch(`/api/admin/albums/${id}/publish`, { published: value });
}

export async function uploadPhotos(
  albumId: number,
  files: File[],
  captions?: (string | null)[]
): Promise<PhotoDTO[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  if (captions?.length) captions.forEach((c) => fd.append("captions", c ?? ""));
  const res = await http.post<PhotoDTO[]>(
    `/api/admin/albums/${albumId}/photos`,
    fd
  );
  return res.data;
}

/* ------------------------------ Public endpoints -------------------------- */

export async function listPublicAlbums(
  page = 0,
  size = 20
): Promise<Page<AlbumDTO>> {
  const res = await http.get<Page<AlbumDTO>>("/api/albums", {
    params: { page, size },
  });
  return res.data;
}

export async function listPublicPhotos(albumId: number): Promise<PhotoDTO[]> {
  const res = await http.get<PhotoDTO[]>(`/api/albums/${albumId}/photos`);
  return res.data;
}
