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
  active: boolean;         // aktiv/publisert
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdvertUpsert = {
  title: string;
  targetUrl?: string;
  startAt?: string;        // ISO
  endAt?: string;          // ISO
  imageFile?: File | null;
  videoFile?: File | null;
};

/* -------------------------------- Helpers --------------------------------- */
const videoExt = /\.(mp4|webm|ogg|mkv|mov)$/i;

function normalizeAdvert(a: any): AdvertDTO {
  const id = Number(a?.id ?? a?.advertId);

  // Kan komme som imageUrl/mediaUrl/url/path/filename – og noen ganger som StoredFile[...]
  const fromFileName = a?.fileName ? `/uploads/adverts/${String(a.fileName)}` : undefined;

  const candidate =
    normUrlPath(a?.mediaUrl) ??
    normUrlPath(a?.imageUrl) ??
    normUrlPath(a?.videoUrl) ??
    normUrlPath(a?.url) ??
    normUrlPath(fromFileName) ??
    normUrlPath(a?.path) ??
    null;

  const ct = String(a?.contentType ?? "").toLowerCase();
  const looksVideo = ct.startsWith("video/") || videoExt.test(candidate ?? "") || !!a?.videoUrl;

  const imageUrl = looksVideo
    ? normUrlPath(a?.imageUrl) ?? null
    : (normUrlPath(a?.imageUrl) ?? candidate ?? null);

  const videoUrl = looksVideo
    ? (normUrlPath(a?.videoUrl) ?? candidate ?? null)
    : (normUrlPath(a?.videoUrl) ?? null);

  return {
    id,
    slug: a?.slug ?? String(id || ""),
    title: a?.title ?? a?.name ?? "Advert",
    description: a?.description ?? null,
    targetUrl: a?.targetUrl ?? a?.link ?? null,
    placement: a?.placement ?? a?.slot ?? a?.position,
    imageUrl,
    videoUrl,
    startAt: a?.startAt ?? a?.startsAt ?? null,
    endAt: a?.endAt ?? a?.endsAt ?? null,
    active: Boolean(a?.active ?? a?.isActive ?? a?.published ?? a?.isPublished ?? false),
    createdAt: a?.createdAt ?? null,
    updatedAt: a?.updatedAt ?? null,
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
  return {
    content: rows.map(normalizeAdvert),
    number: 0,
    size: rows.length,
    totalElements: rows.length,
    totalPages: 1,
  };
}

export async function createAdvert(body: AdvertUpsert): Promise<AdvertDTO> {
  // 1) Opprett metadata
  const created = (await http.post("/api/admin/adverts", {
    title: body.title,
    targetUrl: body.targetUrl ?? null,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
  })).data;

  // 2) Last opp filer (om satt)
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
  return {
    content: rows.map(normalizeAdvert),
    number: 0,
    size: rows.length,
    totalElements: rows.length,
    totalPages: 1,
  };
}
