// admin-web/src/lib/albums.ts
import { http, type Page } from "./events";

// Define AlbumUpsert type (adjust fields as needed)
export type AlbumUpsert = {
  slug: string;
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
  coverPhotoId?: number | null;
  published: boolean;           // behold "published" i frontend
  createdAt: string;
  updatedAt: string;
};

// HJELPER: mappe både "published" og "isPublished" til "published"
function normalizeAlbum(a: any): AlbumDTO {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description ?? null,
    coverPhotoId: a.coverPhotoId ?? null,
    published: (a.published ?? a.isPublished) ?? false,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/* ------------------------------ Admin endpoints --------------------------- */

export async function listAlbumsAdmin(
  page = 0,
  size = 20
): Promise<Page<AlbumDTO>> {
  const res = await http.get<Page<any>>("/api/admin/albums", { params: { page, size } });
  return { ...res.data, content: res.data.content.map(normalizeAlbum) };
}

export async function createAlbum(body: AlbumUpsert): Promise<AlbumDTO> {
  const res = await http.post<any>("/api/admin/albums", body);
  return normalizeAlbum(res.data);
}

export async function updateAlbum(
  id: number,
  body: AlbumUpsert
): Promise<AlbumDTO> {
  // Backend forventer "isPublished" i PUT-body (ikke "published")
  const apiBody: any = { ...body };
  if (Object.prototype.hasOwnProperty.call(apiBody, "published")) {
    apiBody.isPublished = apiBody.published;
    delete apiBody.published;
  }
  const res = await http.put<any>(`/api/admin/albums/${id}`, apiBody);
  return normalizeAlbum(res.data);
}

export async function deleteAlbum(id: number): Promise<void> {
  await http.delete(`/api/admin/albums/${id}`);
}

export async function setAlbumPublished(id: number, value: boolean): Promise<void> {
  // PATCH-endepunktet bruker "published" i body – behold som før
  await http.patch(`/api/admin/albums/${id}/publish`, { published: value });
}

/* ------------------------------ Public endpoints -------------------------- */

export async function listPublicAlbums(page = 0, size = 20): Promise<Page<AlbumDTO>> {
  const res = await http.get<Page<any>>("/api/albums", { params: { page, size } });
  return { ...res.data, content: res.data.content.map(normalizeAlbum) };
}
