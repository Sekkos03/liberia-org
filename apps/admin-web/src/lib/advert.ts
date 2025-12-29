// admin-web/src/lib/advert.ts
import { http, type Page } from "./events";
import { normUrlPath } from "./media";

/* ---------------------------------- Types --------------------------------- */
export type AdvertDTO = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  targetUrl?: string | null;
  placement?: "SIDEBAR" | "HEADER" | string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  startAt?: string | null; // ISO
  endAt?: string | null;   // ISO
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdvertUpsert = {
  title: string;
  targetUrl?: string;
  startAt?: string;
  endAt?: string;
  imageFile?: File | null;
  videoFile?: File | null;
};

const videoExt = /\.(mp4|webm|ogg|mkv|mov)$/i;

/**
 * Når API svarer med `mediaUrl: null`, men gir oss `mediaKind`/`contentType`,
 * kan vi fortsatt rendere ved å bruke public endpoint basert på id.
 *
 * Hvis dine endpoints heter noe annet, endre kun funksjonen under.
 */
function fallbackMediaPathById(id: number, kind: "IMAGE" | "VIDEO"): string {
  return kind === "VIDEO" ? `/api/adverts/${id}/video` : `/api/adverts/${id}/image`;
}

function coerceAdvertPath(v: any): string | null {
  const s = normUrlPath(v);
  if (!s) return null;

  // "/fil.jpg" uten mapper -> anta adverts-folder
  if (/^\/[^^/]+$/.test(s) && !s.startsWith("/uploads/") && !s.startsWith("/files/") && !s.startsWith("/api/")) {
    return `/uploads/media/${s.slice(1)}`;
  }
  return s;
}

function inferKind(a: any, candidate: string | null): "IMAGE" | "VIDEO" {
  const k = String(a?.mediaKind ?? a?.mediaType ?? a?.media_kind ?? a?.media_type ?? "").toUpperCase();
  if (k === "VIDEO") return "VIDEO";
  if (k === "IMAGE") return "IMAGE";

  const ct = String(a?.contentType ?? a?.content_type ?? "").toLowerCase();
  if (ct.startsWith("video/")) return "VIDEO";
  if (ct.startsWith("image/")) return "IMAGE";

  if (videoExt.test(candidate ?? "")) return "VIDEO";
  return "IMAGE";
}

function normalizeAdvert(a: any): AdvertDTO {
  const id = Number(a?.id ?? a?.advertId ?? a?.advert_id);

  const fileName = a?.fileName ?? a?.file_name ?? a?.filename ?? a?.file ?? null;
  const fromFileName = fileName ? `/uploads/media/${String(fileName)}` : undefined;

  // Prøv å finne sti i data (noen miljøer sender dette)
  const candidate =
    coerceAdvertPath(a?.mediaUrl ?? a?.media_url ?? a?.media) ??
    coerceAdvertPath(a?.imageUrl ?? a?.image_url ?? a?.image) ??
    coerceAdvertPath(a?.videoUrl ?? a?.video_url ?? a?.video) ??
    coerceAdvertPath(a?.url) ??
    coerceAdvertPath(fromFileName) ??
    coerceAdvertPath(a?.path) ??
    null;

  const kind = inferKind(a, candidate);

  // Hvis ingen sti ble sendt -> bruk public fallback-endpoint basert på id
  const fallback = fallbackMediaPathById(id, kind);

  const imageUrl = kind === "IMAGE" ? (candidate ?? fallback) : (coerceAdvertPath(a?.imageUrl ?? a?.image_url ?? a?.image) ?? null);
  const videoUrl = kind === "VIDEO" ? (candidate ?? fallback) : (coerceAdvertPath(a?.videoUrl ?? a?.video_url ?? a?.video) ?? null);

  return {
    id,
    slug: a?.slug ?? String(id || ""),
    title: a?.title ?? a?.name ?? "Advert",
    description: a?.description ?? null,
    targetUrl: a?.targetUrl ?? a?.target_url ?? a?.link ?? null,
    placement: a?.placement ?? a?.slot ?? a?.position,
    imageUrl,
    videoUrl,
    startAt: a?.startAt ?? a?.startsAt ?? null,
    endAt: a?.endAt ?? a?.endsAt ?? null,
    active: Boolean(a?.active ?? a?.isActive ?? a?.published ?? a?.isPublished ?? false),
    createdAt: a?.createdAt ?? a?.created_at ?? null,
    updatedAt: a?.updatedAt ?? a?.updated_at ?? null,
  };
}

/* ------------------------------ Admin endpoints --------------------------- */
export async function listAdminAdverts(page = 0, size = 50): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<AdvertDTO> | any>("/api/admin/adverts", { params: { page, size } });
  if (Array.isArray((res.data as any)?.content)) {
    const p = res.data as Page<any>;
    return { ...p, content: p.content.map(normalizeAdvert) };
  }
  const rows = (Array.isArray(res.data) ? res.data : []) as any[];
  return { content: rows.map(normalizeAdvert), number: 0, size: rows.length, totalElements: rows.length, totalPages: 1 };
}

export async function createAdvert(body: AdvertUpsert): Promise<AdvertDTO> {
  const res = await http.post("/api/admin/adverts", {
    title: body.title,
    targetUrl: body.targetUrl ?? null,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
  });

  const created = normalizeAdvert(res.data);

  if (body.imageFile) {
    const fd = new FormData();
    fd.append("file", body.imageFile);
    await http.post(`/api/admin/adverts/${created.id}/image`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  if (body.videoFile) {
    const fd = new FormData();
    fd.append("file", body.videoFile);
    await http.post(`/api/admin/adverts/${created.id}/video`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  const finalRes = await http.get(`/api/admin/adverts/${created.id}`);
  return normalizeAdvert(finalRes.data);
}

export async function updateAdvert(id: number, body: AdvertUpsert): Promise<AdvertDTO> {
  await http.put(`/api/admin/adverts/${id}`, {
    title: body.title,
    targetUrl: body.targetUrl ?? null,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
  });

  if (body.imageFile) {
    const fd = new FormData();
    fd.append("file", body.imageFile);
    await http.post(`/api/admin/adverts/${id}/image`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  if (body.videoFile) {
    const fd = new FormData();
    fd.append("file", body.videoFile);
    await http.post(`/api/admin/adverts/${id}/video`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  const finalRes = await http.get(`/api/admin/adverts/${id}`);
  return normalizeAdvert(finalRes.data);
}

export async function deleteAdvert(id: number): Promise<void> {
  await http.delete(`/api/admin/adverts/${id}`);
}

export async function setAdvertPublished(id: number, value: boolean): Promise<void> {
  await http.post(`/api/admin/adverts/${id}/active`, null, { params: { value } });
}

/* ------------------------------ Public endpoints -------------------------- */
export async function listPublicAdverts(page = 0, size = 20): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<AdvertDTO> | any>("/api/adverts", { params: { page, size } });
  if (Array.isArray((res.data as any)?.content)) {
    const p = res.data as Page<any>;
    return { ...p, content: p.content.map(normalizeAdvert) };
  }
  const rows = (Array.isArray(res.data) ? res.data : []) as any[];
  return { content: rows.map(normalizeAdvert), number: 0, size: rows.length, totalElements: rows.length, totalPages: 1 };
}
