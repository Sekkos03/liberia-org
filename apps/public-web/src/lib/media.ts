import { API_BASE } from "./events";

/** Ekstraher '/uploads/...' fra "StoredFile[... url=/uploads/xyz, ...]" og rydd opp */
export function stripStoredFileToString(u?: string | null): string | undefined {
  if (u == null) return undefined;

  const s0 = String(u).trim();
  if (!s0 || s0 === "null" || s0 === "undefined") return undefined;

  // match url=... frem til komma eller ]
  const m = s0.match(/url=([^,\]]+)/);
  let out = (m ? m[1] : s0).trim();

  if (!out || out === "null" || out === "undefined") return undefined;

  // normaliser windows-path
  out = out.replace(/\\/g, "/");

  // fjerne eventuelle anførselstegn
  out = out.replace(/^["']|["']$/g, "");

  return out;
}

/** Normaliser råverdier til en "sti" (beholder absolutte, ellers sørger for leading /) */
export function normUrlPath(u?: string | null): string | undefined {
  const s = stripStoredFileToString(u);
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

/** Gjør URL nettvennlig og absolutt mot API-basen */
export function toPublicUrl(u?: string | null): string {
  const raw = stripStoredFileToString(u);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw; // allerede absolutt
  return raw.startsWith("/") ? `${API_BASE}${raw}` : `${API_BASE}/${raw}`;
}

/** Velg thumb hvis tilgjengelig, ellers original, og gjør den offentlig (absolutt) */
export function pickImageSrc(thumbUrl?: string | null, url?: string | null) {
  // thumbUrl kan være "null" (string) -> strip... returnerer undefined -> faller tilbake på url
  return toPublicUrl(thumbUrl) || toPublicUrl(url) || "";
}

export const isVideo = (u?: string | null) => {
  const s = stripStoredFileToString(u);
  return !!s && /\.(mp4|webm|ogg|mkv|mov)$/i.test(s);
};
