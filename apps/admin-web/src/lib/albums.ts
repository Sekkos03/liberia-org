// admin-web/src/lib/albums.ts
import { http, type Page } from "./events";

/* ----------------------------- Album-typer ----------------------------- */

export type AlbumUpsert = {
  slug?: string; // backend lar denne være valgfri ved create
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

function slugify(input: string): string {
  const s = (input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
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

  // Hvis backend returnerer Page, bevar meta:
  if (Array.isArray(res.data?.content)) {
    return { ...(res.data as any), content: rows } as Page<AlbumDTO>;
  }
  return rows;
}

export async function createAlbum(body: AlbumUpsert): Promise<AlbumDTO> {
  // Backend krever title; slug er valgfri – generer hvis tom/undefined
  const title = (body.title || "").trim();
  if (!title) throw new Error("Title is required");

  const slug = (body.slug || "").trim();
  const payload: any = {
    title,
    description: body.description ?? null,
    // send published hvis satt
    ...(typeof body.published === "boolean" ? { published: body.published } : {}),
    // bare send slug om den er satt, ellers la backend generere fra title
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

  // Backend støtter published/isPublished via @JsonAlias – send published
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

const videoExt = /\.(mp4|webm|ogg|mkv|mov|avi)$/i;

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

export async function uploadAlbumItemsAdmin(albumId: number, files: File[]): Promise<AdminAlbumItemDTO[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f)); // backend forventer RequestPart("files")
  const res = await http.post(`/api/admin/albums/${albumId}/items`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(res.data, "items").map(normalizeAdminItem);
}

export async function deleteAlbumItemAdmin(albumId: number, itemId: number): Promise<void> {
  await http.delete(`/api/admin/albums/${albumId}/items/${itemId}`);
}
