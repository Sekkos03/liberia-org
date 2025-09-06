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
  startAt?: string | null; // ISO
  endAt?: string | null;   // ISO
  active: boolean;         // <— API-feltet heter active
  createdAt?: string;
  updatedAt?: string;
};

export type AdvertUpsert = {
  title: string;
  targetUrl?: string;
  startAt?: string;        // ISO
  endAt?: string;          // ISO
  imageFile?: File | null; // valgfrie nye filer ved opprett/oppdater
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
  // 1) Opprett med JSON
  const createPayload = {
    title: body.title,
    targetUrl: body.targetUrl ?? null,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
  };
  const created = (await http.post<AdvertDTO>("/api/admin/adverts", createPayload)).data;

  // 2) Last opp bilde (valgfritt) til eget endepunkt
  if (body.imageFile) {
    const fd = new FormData();
    fd.append("file", body.imageFile);
    return (await http.post<AdvertDTO>(`/api/admin/adverts/${created.id}/image`, fd)).data;
  }
  return created;
}

export async function updateAdvert(
  id: number,
  body: AdvertUpsert
): Promise<AdvertDTO> {
  // 1) Oppdater metadata som JSON
  const updatePayload = {
    title: body.title,
    targetUrl: body.targetUrl ?? null,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
  };
  const updated = (await http.put<AdvertDTO>(`/api/admin/adverts/${id}`, updatePayload)).data;

  // 2) Nytt bilde? last opp separat
  if (body.imageFile) {
    const fd = new FormData();
    fd.append("file", body.imageFile);
    return (await http.post<AdvertDTO>(`/api/admin/adverts/${id}/image`, fd)).data;
  }
  return updated;
}

export async function deleteAdvert(id: number): Promise<void> {
  await http.delete(`/api/admin/adverts/${id}`);
}

// Toggle active (ikke /publish, og ikke JSON-body)
export async function setAdvertPublished(id: number, value: boolean): Promise<void> {
  await http.post(`/api/admin/adverts/${id}/active`, null, { params: { value } });
}

/* ------------------------------ Public endpoints -------------------------- */

export async function listPublicAdverts(page = 0, size = 20): Promise<Page<AdvertDTO>> {
  const res = await http.get<Page<AdvertDTO>>("/api/adverts", { params: { page, size } });
  return res.data;
}
