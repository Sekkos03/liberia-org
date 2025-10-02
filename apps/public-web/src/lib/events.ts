
// public-web/src/lib/events.ts
const LOCAL_API = 'http://localhost:8080';
const PROD_API  = 'https://liberia-org.onrender.com';
export const API_BASE  = window.location.hostname === 'localhost' ? LOCAL_API : PROD_API;


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
