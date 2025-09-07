// src/lib/adverts.ts
// Ingen imports fra api.ts – alt ligger lokalt her.

export type MediaKind = "IMAGE" | "VIDEO";

export interface Advert {
  id: number | string;
  title: string;
  summary?: string;
  description?: string;
  mediaType: MediaKind;  // "IMAGE" | "VIDEO"
  mediaUrl: string;      // cover-bilde eller video-fil
  posterUrl?: string;    // poster for video
  createdAt?: string;
  updatedAt?: string;
  // evt. flere felt fra backend ignoreres trygt
}

/* ---------------------- HTTP-hjelpere (kun for adverts) ---------------------- */

/** Bygger absolutt URL fra relativ path, respekterer VITE_API_BASE_URL i prod. */
function buildUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  // I dev med vite-proxy kan vi sende /api/* direkte; i prod prefixer vi med base.
  if (base && !p.startsWith("/api/")) return `${base}${p}`;
  return p;
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

/* --------------------------- Domenelogikk / normalisering --------------------------- */

/** Henter alle annonser. Prøver /api/adverts først (dev-proxy), faller tilbake til /adverts. */
export async function fetchAdverts(): Promise<Advert[]> {
  try {
    const list = await getJSON<any[]>("/api/adverts");
    return normalizeList(list);
  } catch {
    const list = await getJSON<any[]>("/adverts");
    return normalizeList(list);
  }
}

function normalizeList(list: any[]): Advert[] {
  return (list ?? [])
    .filter((x) => x.active !== false)        // filtrer ut ikke-publiserte om de skulle lekke ut
    .map(normalizeAdvert);
}

/** Gjør relative URL-er absolutte, bestemmer mediaType fra contentType/filendelse. */
function normalizeAdvert(a: any): Advert {
  const raw = a.mediaUrl || a.imageUrl || a.url || a.fileUrl || a.path || "";

  // media-type: eksplisitt -> contentType -> filending
  const byContent =
    typeof a.contentType === "string" && a.contentType.toLowerCase().startsWith("video")
      ? "VIDEO"
      : "IMAGE";
  const byExt = /\.(mp4|webm|ogg)$/i.test(String(raw)) ? "VIDEO" : "IMAGE";
  const mediaType: MediaKind = (a.mediaType as MediaKind) || (byContent as MediaKind) || (byExt as MediaKind);

  return {
    id: a.id ?? a.slug ?? crypto.randomUUID(),
    title: a.title ?? a.name ?? "Advert",
    summary: a.summary,
    description: a.description,
    mediaType,
    mediaUrl: absUrl(raw),
    posterUrl: a.posterUrl ? absUrl(a.posterUrl) : undefined,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** Gjør relative filbaner absolutte. */
export function absUrl(url?: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  // Vanlige mønstre fra backend
  if (url.startsWith("/api/")) return url;
  if (url.startsWith("/uploads/") || url.startsWith("/files/")) return `/api${url}`;

  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const p = url.startsWith("/") ? url : `/${url}`;
  return base ? `${base}${p}` : p;
}

/** Nyttig util om du trenger å vise bilder/video separat andre steder. */
export function splitByKind(items: Advert[]) {
  const images = items.filter((x) => x.mediaType === "IMAGE");
  const videos = items.filter((x) => x.mediaType === "VIDEO");
  return { images, videos };
}
