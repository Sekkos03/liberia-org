// public-web/src/lib/events.ts
import { normUrlPath } from "./media";

const LOCAL_API = "http://localhost:8080";
const PROD_API = "https://liberia-org.onrender.com";
export const API_BASE = window.location.hostname === "localhost" ? LOCAL_API : PROD_API;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    credentials: "omit",
    headers: { Accept: "application/json" },
  }).then(handle<T>);
}

/* ---------------------------------- Types --------------------------------- */
export type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  coverImageUrl?: string | null; // path (ikke absolutt)
  rsvpUrl?: string | null;
  startAt: string | null;
  endAt?: string | null;
  galleryAlbumId?: number | null;
  isPublished?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/* ------------------------------- Normalisering ---------------------------- */
/**
 * Backend kan sende litt ulike feltnavn. Vi normaliserer og sørger for at coverImageUrl,
 * hvis den finnes, alltid er en "path" (starter med /) eller absolutt URL.
 */
export function normalizeEvent(e: any): EventDto {
  const id = Number(e?.id ?? e?.eventId);
  const cover =
    normUrlPath(e?.coverImageUrl) ??
    normUrlPath(e?.cover_image_url) ??
    normUrlPath(e?.imageUrl) ??
    normUrlPath(e?.bannerUrl) ??
    normUrlPath(e?.posterUrl) ??
    normUrlPath(e?.url) ??
    null;

  return {
    id,
    slug: e?.slug ?? String(id || ""),
    title: e?.title ?? e?.name ?? "Event",
    summary: e?.summary ?? e?.subtitle ?? null,
    description: e?.description ?? null,
    location: e?.location ?? e?.place ?? null,
    coverImageUrl: cover,
    rsvpUrl: e?.rsvpUrl ?? e?.rsvpURL ?? e?.registrationUrl ?? null,
    startAt: e?.startAt ?? e?.startsAt ?? e?.start ?? null,
    endAt: e?.endAt ?? e?.endsAt ?? e?.end ?? null,
    galleryAlbumId: e?.galleryAlbumId ?? e?.albumId ?? null,
    isPublished: typeof e?.isPublished === "boolean" ? e.isPublished : (typeof e?.published === "boolean" ? e.published : undefined),
    createdAt: e?.createdAt ?? null,
    updatedAt: e?.updatedAt ?? null,
  };
}

/* --------------------------------- Public -------------------------------- */
export async function getEvents(): Promise<EventDto[]> {
  const rows = await apiGet<any>("/api/events");
  const list: any[] = Array.isArray(rows) ? rows : Array.isArray(rows?.content) ? rows.content : [];
  return list.map(normalizeEvent);
}

export async function getEventBySlug(slug: string): Promise<EventDto> {
  const e = await apiGet<any>(`/api/events/${encodeURIComponent(slug)}`);
  return normalizeEvent(e);
}
