// public-web/src/lib/adverts.ts
import { apiGet } from "./events";
import { stripStoredFileToString } from "./media";

export type MediaKind = "IMAGE" | "VIDEO";

export interface Advert {
  id: number | string;
  slug?: string;
  title: string;
  description?: string | null;

  mediaType: MediaKind;
  /** Path or absolute URL to media (image/video). Can be null when API doesn't expose a path. */
  mediaUrl: string | null;

  posterUrl?: string | null;
  targetUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  active?: boolean | null;
}

const videoExt = /\.(mp4|webm|ogg|mkv|mov)$/i;

function pickStr(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (typeof v?.url === "string") return v.url;
  if (typeof v?.path === "string") return v.path;
  return undefined;
}

/** Normaliserer path (beholder absolutt URL, ellers sørger for leading /).
 *  Hvis backend sender bare filnavn, antar vi /uploads/adverts/<filnavn>.
 */
function normAdvertMediaPath(v: any): string {
  const raw0 = stripStoredFileToString(pickStr(v) ?? "");
  if (!raw0) return "";

  if (/^https?:\/\//i.test(raw0)) return raw0;

  const cleaned = raw0.replace(/^\/+/, "");

  // bare filnavn uten mapper
  if (cleaned && !cleaned.includes("/")) return `/uploads/adverts/${cleaned}`;

  return raw0.startsWith("/") ? raw0 : `/${raw0}`;
}

function inferKind(a: any, candidatePath: string): MediaKind {
  const k = String(
    a?.mediaKind ??
      a?.mediaType ??
      a?.media_kind ??
      a?.media_type ??
      a?.kind ??
      a?.type ??
      ""
  ).toUpperCase();

  if (k === "VIDEO") return "VIDEO";
  if (k === "IMAGE") return "IMAGE";

  const ct = String(a?.contentType ?? a?.content_type ?? "").toLowerCase();
  if (ct.startsWith("video/")) return "VIDEO";
  if (ct.startsWith("image/")) return "IMAGE";

  if (a?.videoUrl ?? a?.video_url) return "VIDEO";
  if (a?.imageUrl ?? a?.image_url) return "IMAGE";

  if (videoExt.test(candidatePath)) return "VIDEO";
  return "IMAGE";
}

/**
 * Backenden din returnerer noen ganger `mediaUrl: null` (som i skjermbildet),
 * men vi kan fortsatt bygge en fungerende URL ved å bruke id + mediaKind/contentType.
 *
 * Vi antar følgende endpoints finnes (vanlig mønster):
 *   GET /api/adverts/{id}/image
 *   GET /api/adverts/{id}/video
 *
 * Hvis dine endpoints heter noe annet, endre kun funksjonen under.
 */
function fallbackMediaPathById(id: number | string, kind: MediaKind): string {
  return kind === "VIDEO" ? `/api/adverts/${id}/video` : `/api/adverts/${id}/image`;
}

export function normalizeAdvert(a: any): Advert {
  const id: number | string = a?.id ?? a?.advertId ?? a?.advert_id ?? a?.uuid ?? a?.slug ?? crypto.randomUUID();

  const fileName = a?.fileName ?? a?.file_name ?? a?.filename ?? a?.file ?? null;

  // Kandidat fra felter som noen ganger finnes i API
  const rawMedia =
    a?.mediaUrl ??
    a?.media_url ??
    a?.media ??
    a?.imageUrl ??
    a?.image_url ??
    a?.image ??
    a?.videoUrl ??
    a?.video_url ??
    a?.video ??
    (fileName ? `/uploads/adverts/${String(fileName)}` : null) ??
    a?.url ??
    a?.path ??
    "";

  const candidatePath = normAdvertMediaPath(rawMedia);
  const mediaType = inferKind(a, candidatePath);

  // Hvis backenden ikke gir oss path i det hele tatt -> bygg fallback-endpoint
  const mediaUrl = candidatePath || fallbackMediaPathById(id, mediaType);

  const poster =
    normAdvertMediaPath(a?.posterUrl ?? a?.poster_url) ||
    normAdvertMediaPath(a?.thumbUrl ?? a?.thumb_url ?? a?.thumbnailUrl ?? a?.thumbnail_url) ||
    "";

  const createdAt = a?.createdAt ?? a?.created_at ?? a?.publishedAt ?? a?.published_at ?? null;
  const updatedAt = a?.updatedAt ?? a?.updated_at ?? null;

  const active =
    a?.active ??
    a?.isActive ??
    a?.published ??
    a?.isPublished ??
    a?.is_published ??
    null;

  return {
    id,
    slug: a?.slug ?? undefined,
    title: a?.title ?? a?.name ?? "Advert",
    description: a?.description ?? a?.summary ?? null,
    mediaType,
    mediaUrl: mediaUrl || null,
    posterUrl: poster || null,
    targetUrl: a?.targetUrl ?? a?.target_url ?? a?.link ?? null,
    createdAt,
    updatedAt,
    active: typeof active === "boolean" ? active : null,
  };
}

/** Public: hent publiserte annonser (støtter både Page<T> og array). */
export async function fetchAdverts(page = 0, size = 50): Promise<Advert[]> {
  const data = await apiGet<any>(`/api/adverts?page=${page}&size=${size}`);
  const rows: any[] = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
  return rows.map(normalizeAdvert);
}

/** Alias for eldre kode */
export async function listPublicAdverts(): Promise<Advert[]> {
  return fetchAdverts(0, 200);
}

/** Deler liste i bilder og videoer (nyttig for visning) */
export function splitByKind(items: Advert[]) {
  const images = items.filter((x) => x.mediaType === "IMAGE");
  const videos = items.filter((x) => x.mediaType === "VIDEO");
  return { images, videos };
}
