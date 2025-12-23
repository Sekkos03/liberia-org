import { API_BASE } from "./events";

export function stripStoredFileToString(u?: string | null): string | undefined {
  if (u == null) return undefined;

  const s0 = String(u).trim();
  if (!s0 || s0 === "null" || s0 === "undefined") return undefined;

  const m = s0.match(/url=([^,\]]+)/);
  let out = (m ? m[1] : s0).trim();

  if (!out || out === "null" || out === "undefined") return undefined;

  // Normaliser windows-path
  out = out.replace(/\\/g, "/");

  // Hvis vi får en absolutt path som inneholder /uploads/, klipp til den delen
  const idx = out.indexOf("/uploads/");
  if (idx >= 0) out = out.substring(idx);

  return out;
}

export function toPublicUrl(u?: string | null): string {
  const raw = stripStoredFileToString(u);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? `${API_BASE}${raw}` : `${API_BASE}/${raw}`;
}

export function pickImageSrc(thumbUrl?: string | null, url?: string | null) {
  // viktig: thumbUrl kan være "null" (string) -> strip... returnerer undefined -> faller tilbake på url
  return toPublicUrl(thumbUrl) || toPublicUrl(url) || "";
}
