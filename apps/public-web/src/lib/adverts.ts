// src/lib/adverts.ts
import { apiGet } from "./events";

export type MediaKind = "IMAGE" | "VIDEO";

export interface Advert {
  id: number | string;
  title: string;
  description?: string;
  mediaType: MediaKind;   // "IMAGE" | "VIDEO"
  mediaUrl: string;       // bilde eller video
  posterUrl?: string;
  targetUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

/** Public: hent publiserte annonser. */
export async function fetchAdverts(): Promise<Advert[]> {
  // NB: bruk apiGet (samme som Events) => riktig basepath bak proxy
  const data: any = await apiGet("/api/adverts");

  const raw: any[] =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?._embedded?.adverts)
      ? data._embedded.adverts
      : [];

  return raw
    .filter((a) => a && (a.active ?? true))
    .map(normalizeAdvert);
}

/* -------------------- normalisering / helpers -------------------- */

function absUrl(url?: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/") || url.startsWith("/files/") || url.startsWith("/api/")) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function guessKindFrom(a: any, raw: string): MediaKind {
  if (a?.mediaKind === "VIDEO" || a?.mediaType === "VIDEO") return "VIDEO";
  if (a?.mediaKind === "IMAGE" || a?.mediaType === "IMAGE") return "IMAGE";
  if (typeof a?.contentType === "string") {
    const ct = a.contentType.toLowerCase();
    if (ct.startsWith("video/")) return "VIDEO";
    if (ct.startsWith("image/")) return "IMAGE";
  }
  if (/\.(mp4|webm|ogg)$/i.test(raw)) return "VIDEO";
  return "IMAGE";
}

function normalizeAdvert(a: any): Advert {
  // Entitet: imageUrl + (ev. fileName), DTO: mediaUrl (+ mediaKind/contentType)
  const rawMedia =
    a.mediaUrl ||
    a.imageUrl ||
    (a.fileName ? `/uploads/adverts/${a.fileName}` : "") ||
    a.url ||
    a.path ||
    "";

  const mediaUrl = absUrl(rawMedia);
  const mediaType = guessKindFrom(a, String(rawMedia));

  return {
    id: a.id ?? a.slug ?? crypto.randomUUID(),
    title: a.title ?? a.name ?? "Advert",
    description: a.description ?? a.summary ?? "",
    mediaType,
    mediaUrl,
    posterUrl: a.posterUrl ? absUrl(a.posterUrl) : undefined,
    targetUrl: a.targetUrl ? absUrl(a.targetUrl) : undefined,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    active: a.active,
  };
}

/** Deler liste i bilder og videoer (nyttig for visning) */
export function splitByKind(items: Advert[]) {
  const images = items.filter((x) => x.mediaType === "IMAGE");
  const videos = items.filter((x) => x.mediaType === "VIDEO");
  return { images, videos };
}
