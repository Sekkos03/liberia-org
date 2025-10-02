// admin-web/src/lib/api.ts
import axios from "axios";
import { normUrlPath } from "./media";

/* ------------------------------- HTTP client ------------------------------- */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "https://liberia-org.onrender.com";

function getToken(): string | null {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    null
  );
}

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

http.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    const value = t.startsWith("Bearer ") ? t : `Bearer ${t}`;
    cfg.headers["Authorization"] = value;
  }
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      if (!location.pathname.includes("/login")) {
        location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

/* ---------------------------------- Types --------------------------------- */
export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type EventDTO = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  coverImageUrl: string | null;
  rsvpUrl: string | null;
  startAt: string | null; // ISO
  endAt: string | null;   // ISO
  galleryAlbumId: number | null;
  isPublished: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type EventUpsertRequest = {
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  coverImageUrl: string | null;
  rsvpUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  galleryAlbumId: number | null;
  isPublished: boolean | null;
};

/* ------------------------------- Normalisering ---------------------------- */
function normalizeEvent(e: any): EventDTO {
  const id = Number(e?.id ?? e?.eventId);

  const cover =
    normUrlPath(e?.coverImageUrl) ??
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
    isPublished: Boolean(e?.isPublished ?? e?.published ?? e?.active ?? false),
    createdAt: e?.createdAt ?? null,
    updatedAt: e?.updatedAt ?? null,
  };
}

/* ------------------------------- Auth (login) ------------------------------ */
export async function login(username: string, password: string): Promise<void> {
  const res = await http.post<{ token: string }>("/api/auth/login", {
    username,
    password,
  });
  const tok = res.data.token;
  localStorage.setItem("auth_token", tok.startsWith("Bearer ") ? tok.slice(7) : tok);
}

/* --------------------------- Admin Events (CRUD) --------------------------- */
export async function listAdminEvents(page = 0, size = 20): Promise<Page<EventDTO>> {
  const res = await http.get<Page<EventDTO> | any>("/api/admin/events", { params: { page, size } });
  if (Array.isArray((res.data as any)?.content)) {
    const p = res.data as Page<any>;
    return { ...p, content: p.content.map(normalizeEvent) };
  }
  const rows = (Array.isArray(res.data) ? res.data : []) as any[];
  return { content: rows.map(normalizeEvent), number: 0, size: rows.length, totalElements: rows.length, totalPages: 1 };
}

export async function createEvent(payload: EventUpsertRequest): Promise<EventDTO> {
  const res = await http.post("/api/admin/events", payload);
  return normalizeEvent(res.data);
}

export async function updateEvent(id: number, payload: EventUpsertRequest): Promise<EventDTO> {
  const res = await http.put(`/api/admin/events/${id}`, payload);
  return normalizeEvent(res.data);
}

export async function deleteEvent(id: number): Promise<void> {
  await http.delete(`/api/admin/events/${id}`);
}

export async function setEventPublished(id: number, value: boolean): Promise<void> {
  await http.patch(`/api/admin/events/${id}/publish`, { published: value });
}
