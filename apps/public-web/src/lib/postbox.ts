import { API_BASE } from "./events";

export type SuggestionCreate = {
  name?: string;
  email?: string;
  message: string;
};

/** Submit suggestion (public) */
export async function submitSuggestion(body: SuggestionCreate): Promise<void> {
  const res = await fetch(`${API_BASE}/api/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Kunne ikke sende forslaget");
  }
}
