// lib/albums.ts
import { apiGet } from "./events";

export type PublicAlbum = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  eventSlug?: string | null;
  eventTitle?: string | null;
};

export type Page<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
};

export type AlbumItemKind = "IMAGE" | "VIDEO";
export type AlbumItem = {
  id?: number | string;
  kind: AlbumItemKind;
  url: string;        // direkte visnings-URL (img/video)
  thumbUrl?: string;  // valgfritt thumbnail
  title?: string | null;
  contentType?: string | null;
};

/* ---------------- LISTE (finnes fra før) ---------------- */
export async function listPublicAlbums(
  page: number = 0,
  size: number = 50
): Promise<PublicAlbum[] | Page<PublicAlbum>> {
  const data: any = await apiGet(`/api/albums?page=${page}&size=${size}`);

  const raw =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?._embedded?.albums)
      ? data._embedded.albums
      : [];

  if (!Array.isArray(data) && Array.isArray(data?.content)) {
    return { ...data, content: raw.map(normalizeAlbum) };
  }
  return raw.map(normalizeAlbum);
}

function normalizeAlbum(a: any): PublicAlbum {
  const cover =
    a?.coverUrl ??
    a?.coverImageUrl ??
    a?.coverPhotoUrl ??
    a?.imageUrl ??
    a?.thumbnailUrl ??
    a?.coverPhoto?.url ??
    null;

  return {
    id: a?.id ?? a?.albumId,
    slug: a?.slug ?? String(a?.id ?? ""),
    title: a?.title ?? a?.name ?? "Album",
    description: a?.description ?? null,
    coverUrl: cover,
    eventSlug: a?.eventSlug ?? a?.event?.slug ?? null,
    eventTitle: a?.eventTitle ?? a?.event?.title ?? null,
  };
}

/* ---------------- DETALJ (album + media) ---------------- */

export type PublicAlbumDetail = {
  album: PublicAlbum | null;
  items: AlbumItem[];
};

/** Hent ett album (metadata + media) for public, robust på ulike backend-formater. */
export async function getPublicAlbum(slug: string): Promise<PublicAlbumDetail> {
  // 1) Forsøk dedikert /items-endpoint først
  try {
    const itemsData: any = await apiGet(`/api/albums/${encodeURIComponent(slug)}/items`);
    const items = normalizeItemsCollection(itemsData);
    // prøv også å hente metadata hvis mulig
    let meta: PublicAlbum | null = null;
    try {
      const metaRaw = await apiGet(`/api/albums/${encodeURIComponent(slug)}`);
      meta = normalizeAlbum(metaRaw);
    } catch (_) {
      meta = null;
    }
    return { album: meta, items };
  } catch {
    // 2) Fallback: hent /api/albums/{slug} og les derfra
    const raw: any = await apiGet(`/api/albums/${encodeURIComponent(slug)}`);
    const album = normalizeAlbum(raw);
    const items = normalizeItemsCollection(
      raw?.items ?? raw?.media ?? raw?.files ?? raw?._embedded?.items ?? []
    );
    return { album, items };
  }
}

/* ---------------- Normalisering av media ---------------- */

function looksVideoByExtOrType(rawUrl: string, ct?: string | null) {
  const t = (ct || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|webm|ogg|mkv|mov)$/i.test(rawUrl);
}

function normalizeItem(it: any): AlbumItem {
  // Ensartet URL-normalisering: tillat både http(s) og relative paths
  const norm = (u?: string | null): string | undefined => {
    if (!u) return undefined;
    const s = String(u);
    if (/^https?:\/\//i.test(s)) return s;
    return s.startsWith("/") ? s : `/${s}`;
  };

  // Hvis backend bare gir filnavn, bygg en fornuftig relativ sti
  const fromFileName = it?.fileName
    ? `/uploads/albums/${String(it.fileName)}`
    : undefined;

  const rawUrl: string =
    norm(it?.url) ??
    norm(it?.mediaUrl) ??
    norm(it?.imageUrl) ??
    norm(it?.videoUrl) ??
    norm(fromFileName) ??
    norm(it?.path) ??
    "";

  const ct = String(it?.contentType ?? "");
  const isVideo =
    ct.toLowerCase().startsWith("video/") ||
    /\.(mp4|webm|ogg|mkv|mov)$/i.test(rawUrl) ||
    !!it?.videoUrl;

  return {
    id: it?.id,
    kind: isVideo ? "VIDEO" : "IMAGE",
    url: rawUrl,
    thumbUrl: it?.thumbUrl ?? it?.thumbnailUrl ?? it?.thumbnail ?? undefined,
    title: it?.title ?? null,
    contentType: it?.contentType ?? null,
  };
}

function normalizeItemsCollection(data: any): AlbumItem[] {
  const arr =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?._embedded?.items)
      ? data._embedded.items
      : [];
  return arr.map(normalizeItem);
}
