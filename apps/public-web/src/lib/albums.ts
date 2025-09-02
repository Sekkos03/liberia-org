// public-web/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${txt ? ` – ${txt}` : ""}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, { 
    credentials: "omit", 
    headers: { Accept: "application/json" }, 
}).then(handle<T>);
}

// ---- Events (public) --------------------------------------------------------
export type PublicEvent = {
  slug: string;
  title: string;
  summary?: string | null;
  startAt?: string | null;
  endAt?: string | null;
};
export function listPublicEvents(): Promise<PublicEvent[]> {
  return apiGet(`/api/events`);
}

// ---- Albums (public) --------------------------------------------------------
export type PublicAlbum = {
  id: number;
  slug: string;
  title: string;
  coverUrl?: string | null;
  photoCount: number;
};

export type PublicPhoto = { id: number; url: string; caption?: string | null };

export function listPublicAlbums(): Promise<PublicAlbum[]> {
  return apiGet(`/api/albums`);
}

export function getPublicAlbum(slug: string): Promise<{ album: PublicAlbum; photos: PublicPhoto[] }> {
  return apiGet(`/api/albums/${slug}`);
}
