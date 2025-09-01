// Central API helper + types

// public-web/src/lib/api.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    // 👇 public site should not send cookies/auth by default
    credentials: "omit",
    headers: { Accept: "application/json" },
  }).then(handle<T>);
}


export type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  rsvpUrl?: string | null;
  startAt?: string | null; // ISO OffsetDateTime
  endAt?: string | null;   // ISO OffsetDateTime
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function authHeader() {
  const token = localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "omit",
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeader(),
      ...(init.headers || {}),
    },
  });

  // 204 No Content
  if (res.status === 204) {
    // @ts-expect-error allow void
    return null;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (body?.detail || body?.message)) ||
      `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return body as T;
}

// Specific helpers
export const AdminApi = {
  listEvents: () => apiFetch<EventDto[] | { items?: EventDto[]; content?: EventDto[] }>("/api/admin/events"),
};
