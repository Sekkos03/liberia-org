// admin-web/src/lib/api.ts
import axios from "axios";

/* ------------------------------- HTTP client ------------------------------- */
const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8080";

function getToken(): string | null {
  // Try a few common keys to be safe
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

// Attach Authorization header if we have a token
http.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    // Ensure single "Bearer " prefix (avoid double)
    const value = t.startsWith("Bearer ") ? t : `Bearer ${t}`;
    cfg.headers["Authorization"] = value;
  }
  return cfg;
});

// If backend says 401, nuke token and send user to login
http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      // Redirect only if we’re not already on login
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
  startAt: string | null; // ISO string from backend (OffsetDateTime)
  endAt: string | null;   // ISO string
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
  startAt: string | null; // send ISO (we convert from datetime-local in UI)
  endAt: string | null;
  galleryAlbumId: number | null;
  isPublished: boolean | null;
};



/* ------------------------------- Auth (login) ------------------------------ */
export async function login(username: string, password: string): Promise<void> {
  const res = await http.post<{ token: string }>("/api/auth/login", {
    username,
    password,
  });
  const tok = res.data.token;
  // Store as "auth_token" (our preferred key)
  localStorage.setItem("auth_token", tok.startsWith("Bearer ") ? tok.slice(7) : tok);
}

/* --------------------------- Admin Events (CRUD) --------------------------- */
export async function listAdminEvents(
  page = 0,
  size = 20
): Promise<Page<EventDTO>> {
  const res = await http.get<Page<EventDTO>>("/api/admin/events", {
    params: { page, size },
  });
  return res.data;
}

export async function createEvent(payload: EventUpsertRequest): Promise<EventDTO> {
  const res = await http.post<EventDTO>("/api/admin/events", payload);
  return res.data;
}

export async function updateEvent(
  id: number,
  payload: EventUpsertRequest
): Promise<EventDTO> {
  const res = await http.put<EventDTO>(`/api/admin/events/${id}`, payload);
  return res.data;
}

export async function deleteEvent(id: number): Promise<void> {
  await http.delete(`/api/admin/events/${id}`);
}

export async function setEventPublished(
  id: number,
  value: boolean
): Promise<void> {
  // Option B: PATCH full method with JSON body
  await http.patch(`/api/admin/events/${id}/publish`, { published: value });
}
