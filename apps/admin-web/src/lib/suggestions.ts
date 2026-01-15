// admin-web/src/lib/suggestions.ts
import { http, type Page } from "./events";

/* ---------------------------------- Typer ---------------------------------- */

export type SuggestionDTO = {
  id: number;
  name?: string | null;
  email?: string | null;
  message: string;
  status: string;        // "NEW" | "HANDLED" ...
  handled: boolean;      // derived: status === "HANDLED"
  createdAt: string;     // ISO string for UI
};

type BackendSuggestion = {
  id: number;
  name?: string | null;
  email?: string | null;
  message: string;
  status: string;
  createdAt: any; // Instant kan komme som string/number
};

function toIso(v: any): string {
  if (v == null) return new Date(0).toISOString();

  if (typeof v === "number" && Number.isFinite(v)) {
    // backend kan sende epoch seconds (eller ms)
    const ms = v < 1e12 ? v * 1000 : v;
    return new Date(ms).toISOString();
  }

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return new Date(0).toISOString();

    // "1700000000.123" -> seconds
    if (/^\d+(\.\d+)?$/.test(s)) {
      const seconds = Number(s);
      return new Date(seconds * 1000).toISOString();
    }

    const t = Date.parse(s);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }

  try {
    return new Date(v).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

function normalizeSuggestion(s: BackendSuggestion): SuggestionDTO {
  const status = String(s.status ?? "NEW").toUpperCase();
  return {
    id: Number(s.id),
    name: s.name ?? null,
    email: s.email ?? null,
    message: s.message ?? "",
    status,
    handled: status === "HANDLED",
    createdAt: toIso(s.createdAt),
  };
}

/* ------------------------------ Admin-endepunkter --------------------------- */

export async function listSuggestionsAdmin(page = 0, size = 20): Promise<Page<SuggestionDTO>> {
  const res = await http.get<Page<BackendSuggestion>>("/api/admin/suggestions", {
    params: { page, size },
  });

  const p = res.data as any;
  return {
    ...p,
    content: (p.content ?? []).map(normalizeSuggestion),
  };
}

/**
 * ✅ Marker håndtert/ikke håndtert (backend støtter nå /handled)
 */
export async function setSuggestionHandled(id: number, value: boolean): Promise<SuggestionDTO> {
  const res = await http.patch<SuggestionDTO>(`/api/admin/suggestions/${id}/handled`, { handled: value });
  // backend returnerer SuggestionResponse -> normaliser
  return normalizeSuggestion(res.data as any);
}

// Slett (admin)
export async function deleteSuggestionAdmin(id: number): Promise<void> {
  await http.delete(`/api/admin/suggestions/${id}`);
}
