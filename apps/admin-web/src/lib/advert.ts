import { http, type Page } from "./api";

/* ---------------------------------- Types --------------------------------- */

export type AdvertDTO = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  targetUrl?: string | null;
  placement?: "SIDEBAR" | "HEADER" | string;
  imageUrl?: string | null;
  /** Valgfritt felt dersom backend støtter video */
  videoUrl?: string | null;
  startAt?: string | null; // ISO
  endAt?: string | null;   // ISO
  active: boolean;         // aktiv/publisert
  createdAt?: string;
  updatedAt?: string;
};

export type AdvertUpsert = {
  title: string;
  targetUrl?: string;
  startAt?: string;        // ISO
  endAt?: string;          // ISO
  imageFile?: File | null; // valgfritt
  videoFile?: File | null; // valgfritt
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
  // 1) Opprett metadata
  const created = (
    await http.post<AdvertDTO>("/api/admin/adverts", {
      title: body.title,
      targetUrl: body.targetUrl ?? null,
      startAt: body.startAt ?? null,
      endAt: body.endAt ?? null,
    })
  ).data;

  // 2) Last opp filer (om satt)
  if (body.imageFile) {
    const fd = new FormData();
    fd.append("file", body.imageFile);
    await http.post<AdvertDTO>(`/api/admin/adverts/${created.id}/image`, fd);
  }
  if (body.videoFile) {
    const fd = new FormData();
    fd.append("file", body.videoFile);
    await http.post<AdvertDTO>(`/api/admin/adverts/${created.id}/video`, fd);
  }

  // Returner siste versjon
  return (await http.get<AdvertDTO>(`/api/admin/adverts/${created.id}`)).data;
}

export async function updateAdvert(id: number, body: AdvertUpsert): Promise<AdvertDTO> {
  // 1) Oppdater metadata
  await http.put<AdvertDTO>(`/api/admin/adverts/${id}`, {
    title: body.title,
    targetUrl: body.targetUrl ?? null,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
  });

  // 2) Eventuelle nye filer
  if (body.imageFile) {
    const fd = new FormData();
    fd.append("file", body.imageFile);
    await http.post<AdvertDTO>(`/api/admin/adverts/${id}/image`, fd);
  }
  if (body.videoFile) {
    const fd = new FormData();
    fd.append("file", body.videoFile);
    await http.post<AdvertDTO>(`/api/admin/adverts/${id}/video`, fd);
  }

  return (await http.get<AdvertDTO>(`/api/admin/adverts/${id}`)).data;
}

export async function deleteAdvert(id: number): Promise<void> {
  await http.delete(`/api/admin/adverts/${id}`);
}

/** Toggle active (backend endepunkt: POST /active?value=true|false) */
export async function setAdvertPublished(id: number, value: boolean): Promise<void> {
  await http.post(`/api/admin/adverts/${id}/active`, null, { params: { value } });
}

/* ------------------------------ Public endpoints -------------------------- */

export async function listPublicAdverts(page = 0, size = 20): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<AdvertDTO>>("/api/adverts", { params: { page, size } });
  return res.data;
}
