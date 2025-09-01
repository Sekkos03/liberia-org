// public-web/src/lib/api.ts
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
    credentials: "include",
    headers: { "Accept": "application/json" },
  }).then(handle<T>);
}
