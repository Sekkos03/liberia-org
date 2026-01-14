// admin-web/src/lib/advert.ts
import { http, type Page } from "./events";
import { normUrlPath } from "./media";

/* ---------------------------------- Types --------------------------------- */
export type MediaKind = "IMAGE" | "VIDEO";

export type AdvertDTO = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  targetUrl?: string | null;
  placement?: "SIDEBAR" | "HEADER" | string;
  active: boolean;

  // UI bruker disse for rendering
  imageUrl?: string | null;
  videoUrl?: string | null;

  startAt?: string | null; // ISO i frontend
  endAt?: string | null;   // ISO i frontend

  // raw fra backend (valgfritt)
  mediaUrl?: string | null;
  mediaKind?: MediaKind | string | null;
  sizeBytes?: number | null;
  contentType?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdvertUpsert = {
  title: string;
  targetUrl?: string;
  startAt?: string; // ISO fra UI
  endAt?: string;   // ISO fra UI
  placement?: "SIDEBAR" | "HEADER" | string;
  active?: boolean;

  // disse er kun for UI
  imageFile?: File | null;
  videoFile?: File | null;
};

type UpsertAdvertReq = {
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  targetUrl?: string | null;
  placement?: string | null;
  imageUrl?: string | null;
  active?: boolean | null;

  // Backend forventer OffsetDateTime, men din Jackson serialiserer som timestamp.
  // Vi sender derfor epoch seconds (number) for trygg deserialisering.
  startAt?: number | null; // epoch seconds
  endAt?: number | null;   // epoch seconds
};

const videoExt = /\.(mp4|webm|ogg|mkv|mov)$/i;

/* ------------------------------ Helpers ----------------------------------- */

function slugifyTitle(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toEpochSecondsOrNull(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor(t / 1000);
}

function fromBackendTimeToIso(v: any): string | null {
  if (v == null) return null;

  // backend sender ofte number som epoch seconds (evt med nanos)
  if (typeof v === "number" && Number.isFinite(v)) {
    const seconds = v < 1e12 ? v : v / 1000; // safety
    return new Date(seconds * 1000).toISOString();
  }

  // noen kan komme som string "1768363903.363401000"
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    if (/^\d+(\.\d+)?$/.test(s)) {
      const seconds = Number(s);
      if (!Number.isFinite(seconds)) return null;
      return new Date(seconds * 1000).toISOString();
    }

    const t = Date.parse(s);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }

  return null;
}

function coercePath(v: any): string | null {
  const s = normUrlPath(v);
  if (!s) return null;

  // bare filnavn -> /uploads/media/<fil>
  if (!s.includes("/") && !s.startsWith("http")) return `/uploads/media/${s}`;

  // "/file.jpg" uten mapper -> /uploads/media/file.jpg
  if (/^\/[^/]+$/.test(s) && !s.startsWith("/uploads/") && !s.startsWith("/api/")) {
    return `/uploads/media/${s.slice(1)}`;
  }
  return s;
}

/**
 * Backend DTO har:
 * - mediaUrl: "/uploads/media/<fileName>" hvis fil er lastet opp
 * - mediaKind: "VIDEO" hvis contentType starter med "video/"
 *
 * Vi mapper dette til imageUrl/videoUrl for UI.
 */
function normalizeAdvert(a: any): AdvertDTO {
  const id = Number(a?.id ?? a?.advertId ?? a?.advert_id);

  const mediaUrl = coercePath(a?.mediaUrl ?? a?.media_url ?? null);
  const mediaKind: string = String(a?.mediaKind ?? a?.media_kind ?? "").toUpperCase();

  // Hvis backend ikke sender mediaKind men sender contentType
  const contentType = (a?.contentType ?? a?.content_type ?? null) as string | null;
  const inferredKind: MediaKind =
    mediaKind === "VIDEO"
      ? "VIDEO"
      : mediaKind === "IMAGE"
        ? "IMAGE"
        : contentType?.toLowerCase().startsWith("video/")
          ? "VIDEO"
          : mediaUrl && videoExt.test(mediaUrl)
            ? "VIDEO"
            : "IMAGE";

  const imageUrl = inferredKind === "IMAGE" ? mediaUrl : null;
  const videoUrl = inferredKind === "VIDEO" ? mediaUrl : null;

  return {
    id,
    slug: a?.slug ?? String(id || ""),
    title: a?.title ?? a?.name ?? "Advert",
    description: a?.description ?? null,
    targetUrl: a?.targetUrl ?? a?.target_url ?? a?.link ?? null,
    placement: a?.placement ?? a?.slot ?? a?.position ?? null,
    active: Boolean(a?.active ?? a?.isActive ?? a?.published ?? a?.isPublished ?? false),

    mediaUrl: mediaUrl ?? null,
    mediaKind: inferredKind,
    sizeBytes: a?.sizeBytes ?? a?.size_bytes ?? null,
    contentType: contentType,

    imageUrl,
    videoUrl,

    startAt: fromBackendTimeToIso(a?.startAt ?? a?.start_at ?? null),
    endAt: fromBackendTimeToIso(a?.endAt ?? a?.end_at ?? null),
    createdAt: fromBackendTimeToIso(a?.createdAt ?? a?.created_at ?? null),
    updatedAt: fromBackendTimeToIso(a?.updatedAt ?? a?.updated_at ?? null),
  };
}

function buildModel(body: AdvertUpsert): UpsertAdvertReq {
  const slug = slugifyTitle(body.title);

  return {
    slug,
    title: body.title,
    targetUrl: body.targetUrl ?? "",
    placement: (body.placement ?? "SIDEBAR") as string,
    active: body.active ?? true,
    startAt: toEpochSecondsOrNull(body.startAt ?? null),
    endAt: toEpochSecondsOrNull(body.endAt ?? null),
  };
}

/**
 * VIKTIG: controlleren din forventer multipart med:
 * - @RequestPart("model") UpsertAdvertReq
 * - @RequestPart("file") MultipartFile
 */
function buildMultipart(model: UpsertAdvertReq, file: File): FormData {
  const fd = new FormData();
  fd.append(
    "model",
    new Blob([JSON.stringify(model)], { type: "application/json" })
  );
  fd.append("file", file);
  return fd;
}

/* ------------------------------ API calls ---------------------------------- */

export async function listAdminAdverts(page = 0, size = 50): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<any>>("/api/admin/adverts", { params: { page, size } });
  return {
    ...res.data,
    content: (res.data?.content ?? []).map(normalizeAdvert),
  };
}

/**
 * CREATE:
 * - hvis videoFile/imageFile finnes -> send multipart til POST /api/admin/adverts
 * - ellers send JSON
 */
export async function createAdvert(body: AdvertUpsert): Promise<AdvertDTO> {
  const model = buildModel(body);

  // Backend har kun ÉN fil per advert (fileName/contentType).
  // Hvis både video og image er valgt, prioriter video.
  const file = body.videoFile ?? body.imageFile ?? null;

  if (file) {
    const fd = buildMultipart(model, file);
    const res = await http.post("/api/admin/adverts", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeAdvert(res.data);
  } else {
    const res = await http.post("/api/admin/adverts", model);
    return normalizeAdvert(res.data);
  }
}

/**
 * UPDATE:
 * - hvis videoFile/imageFile finnes -> PUT multipart til /api/admin/adverts/{id}
 * - ellers PUT JSON
 */
export async function updateAdvert(id: number, body: AdvertUpsert): Promise<AdvertDTO> {
  const model = buildModel(body);
  const file = body.videoFile ?? body.imageFile ?? null;

  if (file) {
    const fd = buildMultipart(model, file);
    const res = await http.put(`/api/admin/adverts/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeAdvert(res.data);
  } else {
    const res = await http.put(`/api/admin/adverts/${id}`, model);
    return normalizeAdvert(res.data);
  }
}

export async function deleteAdvert(id: number): Promise<void> {
  await http.delete(`/api/admin/adverts/${id}`);
}

export async function setAdvertPublished(id: number, value: boolean): Promise<void> {
  await http.post(`/api/admin/adverts/${id}/active`, null, { params: { value } });
}
