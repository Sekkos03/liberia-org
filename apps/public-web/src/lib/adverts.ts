// public-web/src/lib/adverts.ts
import { apiGet } from "./events";
import { stripStoredFileToString } from "./media";

export type MediaKind = "IMAGE" | "VIDEO";

export interface Advert {
  id: number | string;
  slug?: string;
  title: string;
  description?: string | null;
  targetUrl?: string | null;

  mediaKind: MediaKind;
  mediaUrl: string | null;

  startAt?: string | null;
  endAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  active?: boolean | null;
}

function fromBackendTimeToIso(v: any): string | null {
  if (v == null) return null;

  if (typeof v === "number" && Number.isFinite(v)) {
    const seconds = v < 1e12 ? v : v / 1000;
    return new Date(seconds * 1000).toISOString();
  }

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

function normPath(v: any): string | null {
  const raw = stripStoredFileToString(v);
  if (!raw) return null;

  // backend mapperen din sender typisk "/uploads/media/<file>"
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function normalizeAdvert(a: any): Advert {
  const id = a?.id ?? a?.advertId ?? a?.advert_id ?? a?.slug ?? `${Date.now()}-${Math.random()}`;

  const kind = String(a?.mediaKind ?? a?.media_kind ?? "").toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE";
  const mediaUrl = normPath(a?.mediaUrl ?? a?.media_url ?? null);

  const active =
    typeof a?.active === "boolean"
      ? a.active
      : typeof a?.published === "boolean"
        ? a.published
        : null;

  return {
    id,
    slug: a?.slug ?? undefined,
    title: a?.title ?? a?.name ?? "Advert",
    description: a?.description ?? null,
    targetUrl: a?.targetUrl ?? a?.target_url ?? a?.link ?? null,

    mediaKind: kind as MediaKind,
    mediaUrl,

    startAt: fromBackendTimeToIso(a?.startAt ?? a?.start_at ?? null),
    endAt: fromBackendTimeToIso(a?.endAt ?? a?.end_at ?? null),
    createdAt: fromBackendTimeToIso(a?.createdAt ?? a?.created_at ?? null),
    updatedAt: fromBackendTimeToIso(a?.updatedAt ?? a?.updated_at ?? null),

    active,
  };
}

export async function fetchAdverts(page = 0, size = 50): Promise<Advert[]> {
  const data = await apiGet<any>(`/api/adverts?page=${page}&size=${size}`);
  const rows: any[] = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
  return rows.map(normalizeAdvert);
}
