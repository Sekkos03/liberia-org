// public-web/src/lib/membership.ts
import { API_BASE } from "./api";

export type MembershipFormSettings = { url: string; title?: string; description?: string };

// Henter Forms-URL fra backend. Faller tilbake til .env hvis 404.
export async function getPublicMembershipForm(): Promise<MembershipFormSettings> {
  try {
    const res = await fetch(`${API_BASE}/api/membership/form`);
    if (res.ok) return res.json();
  } catch {
    /* ignorer */
  }
  return {
    url: import.meta.env.VITE_GOOGLE_FORM_URL ?? "",
  };
}
