// admin-web/src/lib/albums.ts
import { http, type Page } from "./events";

/* ----------------------------- Album-typer ----------------------------- */

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
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  eventId?: number | null;
  eventTitle?: string | null;
};

/* ------------------------------ Hjelpere ------------------------------- */

function unwrap<T = any>(data: any, embeddedKey?: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.content)) return data.content as T[];
  if (embeddedKey && Array.isArray(data?._embedded?.[embeddedKey])) {
    return data._embedded[embeddedKey] as T[];
  }
  return [];
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

  // Hvis backend returnerer Page, bevar meta:
  if (Array.isArray(res.data?.content)) {
    return { ...(res.data as any), content: rows } as Page<AlbumDTO>;
  }
  return rows;
}

export async function createAlbum(body: AlbumUpsert): Promise<AlbumDTO> {
  const res = await http.post(`/api/admin/albums`, body);
  return normalizeAlbum(res.data);
}

export async function setAlbumPublished(id: number, value: boolean): Promise<AlbumDTO> {
  // enkelte backends bruker "isPublished" i body
  const res = await http.put(`/api/admin/albums/${id}`, { isPublished: value });
  return normalizeAlbum(res.data);
}

export async function updateAlbum(id: number, body: Partial<AlbumUpsert>): Promise<AlbumDTO> {
  const apiBody: any = { ...body };
  if (Object.prototype.hasOwnProperty.call(apiBody, "published")) {
    apiBody.isPublished = apiBody.published;
    delete apiBody.published;
  }
  const res = await http.put(`/api/admin/albums/${id}`, apiBody);
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

const videoExt = /\.(mp4|webm|ogg|mkv|mov)$/i;

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
  const looksVideo = ct.toLowerCase().startsWith("video/") || videoExt.test(url) || !!it?.videoUrl;

  return {
    id: Number(it?.id ?? it?.itemId),
    title: it?.title ?? null,
    kind: looksVideo ? "VIDEO" : "IMAGE",
    url,
    thumbUrl:
  normUrl(it?.thumbUrl ?? it?.thumbnailUrl ?? it?.thumbnail) ?? null,
    contentType: it?.contentType ?? null,
    sizeBytes: it?.sizeBytes ?? it?.size ?? null,
    createdAt: it?.createdAt ?? null,
  };
}

export async function listAlbumItemsAdmin(albumId: number): Promise<AdminAlbumItemDTO[]> {
  const res = await http.get(`/api/admin/albums/${albumId}/items`);
  return unwrap(res.data, "items").map(normalizeAdminItem);
}

export async function uploadAlbumItemsAdmin(albumId: number, files: File[]): Promise<AdminAlbumItemDTO[]> {
  const fd = new FormData();
  files.forEach((f) => {
    // støtt både "files" og "file" i tilfelle backend forventer det
    fd.append("files", f);
    fd.append("file", f);
  });

  const res = await http.post(`/api/admin/albums/${albumId}/items`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return unwrap(res.data, "items").map(normalizeAdminItem);
}

export async function deleteAlbumItemAdmin(albumId: number, itemId: number): Promise<void> {
  await http.delete(`/api/admin/albums/${albumId}/items/${itemId}`);
}
