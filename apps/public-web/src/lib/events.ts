
// public-web/src/lib/events.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    // 👇 public site should not send cookies/auth by default
    credentials: "omit",
    headers: { Accept: "application/json" },
  }).then(handle<T>);
}

export async function getEvents() {
  const res = await fetch("/api/events");
  return res.json();
}
