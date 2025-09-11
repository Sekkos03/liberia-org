// Hjelpere for å vise media riktig (tåler også verdier som "StoredFile[...]")

export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

/** Ekstraher '/uploads/...' fra "StoredFile[... url=/uploads/xyz, ...]" */
export function stripStoredFileToString(u?: string | null): string | undefined {
  if (!u) return undefined;
  const s = String(u);
  const m = s.match(/url=([^,\]]+)/);       // plukk ut url=... fram til , eller ]
  return m ? m[1] : s;
}

/** Gjør URL nettvennlig og absolutt mot API-basen */
export function toPublicUrl(u?: string | null): string {
  const raw = stripStoredFileToString(u);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;           // allerede absolutt
  return raw.startsWith("/") ? `${API_BASE}${raw}` : `${API_BASE}/${raw}`;
}

/** Normaliser råverdier til en sti (beholder absolutte, ellers prefix’er med /) */
export function normUrlPath(u?: string | null): string | undefined {
  const s = stripStoredFileToString(u);
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

/** Velg thumb hvis tilgjengelig, ellers original, og gjør den offentlig (absolutt) */
export function pickImageSrc(thumbUrl?: string | null, url?: string | null) {
  return toPublicUrl(thumbUrl || url || "");
}

export const isVideo = (u?: string | null) =>
  !!stripStoredFileToString(u) &&
  /\.(mp4|webm|ogg|mkv|mov)$/i.test(stripStoredFileToString(u)!);
