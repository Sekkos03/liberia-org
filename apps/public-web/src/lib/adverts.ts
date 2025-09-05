// Public adverts API – no auth
import { API_BASE } from "../lib/api"; // same helper you use in public-web

export type PublicAdvert = {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
};

export async function listPublicAdverts(): Promise<PublicAdvert[]> {
  const res = await fetch(`${API_BASE}/api/adverts`);
  if (!res.ok) throw new Error("Failed to load adverts");
  return res.json();
}
