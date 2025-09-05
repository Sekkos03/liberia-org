// admin-web/src/lib/advert.ts
// Bruker samme http/auth-mekanisme som albums.ts
import { http, type Page } from "./api";

/* ---------------------------------- Types --------------------------------- */

export type AdvertDTO = {
  id: number;
  title: string;
  imageUrl: string | null;
  targetUrl?: string | null;
  startAt?: string | null; // ISO
  endAt?: string | null;   // ISO
  published: boolean;
  createdAt?: string;      // ISO
  updatedAt?: string;      // ISO
};

export type AdvertUpsert = {
  title: string;
  targetUrl?: string;
  startAt?: string;        // ISO
  endAt?: string;          // ISO
  /** Valgfritt ved oppdatering: last opp ny fil */
  imageFile?: File | null;
  /** Alternativ til fil: pek direkte på ekstern URL */
  imageUrl?: string;
};

/* ------------------------------ Admin endpoints --------------------------- */

export async function listAdminAdverts(
  page = 0,
  size = 50
): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<AdvertDTO>>("/api/admin/adverts", {
    params: { page, size },
  });
  return res.data;
}

export async function createAdvert(body: AdvertUpsert): Promise<AdvertDTO> {
  const fd = new FormData();
  fd.append("title", body.title);
  if (body.targetUrl) fd.append("targetUrl", body.targetUrl);
  if (body.startAt) fd.append("startAt", body.startAt);
  if (body.endAt) fd.append("endAt", body.endAt);
  if (body.imageFile) fd.append("image", body.imageFile);
  if (body.imageUrl) fd.append("imageUrl", body.imageUrl);

  const res = await http.post<AdvertDTO>("/api/admin/adverts", fd);
  return res.data;
}

export async function updateAdvert(
  id: number,
  body: AdvertUpsert
): Promise<AdvertDTO> {
  const fd = new FormData();
  fd.append("title", body.title);
  if (body.targetUrl) fd.append("targetUrl", body.targetUrl);
  if (body.startAt) fd.append("startAt", body.startAt);
  if (body.endAt) fd.append("endAt", body.endAt);
  if (body.imageFile) fd.append("image", body.imageFile);
  if (body.imageUrl) fd.append("imageUrl", body.imageUrl);

  const res = await http.put<AdvertDTO>(`/api/admin/adverts/${id}`, fd);
  return res.data;
}

export async function deleteAdvert(id: number): Promise<void> {
  await http.delete(`/api/admin/adverts/${id}`);
}

/**
 * Toggle publish – speiler mønsteret brukt for albums/events.
 * Backend-endepunkt må være PATCH /api/admin/adverts/{id}/published
 * og akseptere { published: boolean } i body.
 */
export async function setAdvertPublished(
  id: number,
  value: boolean
): Promise<void> {
  await http.patch(`/api/admin/adverts/${id}/publish`, {
    published: value,
  });
}

/* ------------------------------ Public endpoints -------------------------- */

export async function listPublicAdverts(
  page = 0,
  size = 20
): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<AdvertDTO>>("/api/adverts", {
    params: { page, size },
  });
  return res.data;
}
