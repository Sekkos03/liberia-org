// Public adverts API – no auth
import { API_BASE } from "../lib/api";

export type PublicAdvert = {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl?: string | null;
};

export type Placement = "HOME_TOP" | "SIDEBAR" | "FOOTER" | "INLINE";

export async function listPublicAdverts(
  placement: Placement = "SIDEBAR"
): Promise<PublicAdvert[]> {
  const url = new URL(`${API_BASE}/api/adverts`);
  url.searchParams.set("placement", placement);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load adverts");
  return res.json();
}
