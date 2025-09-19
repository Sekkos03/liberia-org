// admin-web/src/lib/suggestions.ts
import { http, type Page } from "./events";

/* ---------------------------------- Typer ---------------------------------- */

export type SuggestionDTO = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
  handled: boolean;             // eller "resolved" dersom backend bruker det navnet
  internalNotes?: string | null;
  createdAt: string;            // ISO
  updatedAt: string;            // ISO
};

export type SuggestionCreate = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
};

export type SuggestionUpdate = {
  handled?: boolean;
  internalNotes?: string | null;
};

/* ------------------------------ Admin-endepunkter --------------------------- */

// Liste (admin, paginert)
export async function listSuggestionsAdmin(
  page = 0,
  size = 20
): Promise<Page<SuggestionDTO>> {
  const res = await http.get<Page<SuggestionDTO>>("/api/admin/suggestions", {
    params: { page, size },
  });
  return res.data;
}

// Oppdater (admin) – bruk hvis du redigerer notater/markerer som håndtert via full oppdatering
export async function updateSuggestionAdmin(
  id: number,
  body: SuggestionUpdate
): Promise<SuggestionDTO> {
  const res = await http.put<SuggestionDTO>(`/api/admin/suggestions/${id}`, body);
  return res.data;
}

// Marker håndtert/ikke håndtert (admin) – PATCH i samme stil som publish på albums/events
export async function setSuggestionHandled(
  id: number,
  value: boolean
): Promise<void> {
  // Backend-rute forventet: PATCH /api/admin/suggestions/{id}/handled  body: { handled: boolean }
  await http.patch(`/api/admin/suggestions/${id}/handled`, { handled: value });
}

// Slett (admin)
export async function deleteSuggestionAdmin(id: number): Promise<void> {
  await http.delete(`/api/admin/suggestions/${id}`);
}

/* ------------------------------- Public-endepunkt --------------------------- */

// Innsending fra PostBox (public, ingen auth)
export async function submitSuggestion(body: SuggestionCreate): Promise<void> {
  await http.post("/api/suggestions", body);
}
