import { useQuery } from "@tanstack/react-query";
import { AdminApi, type EventDto } from "../../lib/api";

function toArray(data: unknown): EventDto[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const anyData = data as any;
    if (Array.isArray(anyData.items)) return anyData.items;
    if (Array.isArray(anyData.content)) return anyData.content;
  }
  return [];
}

export default function AdminEvents() {
  const q = useQuery({
    queryKey: ["admin-events"],
    queryFn: AdminApi.listEvents,
  });

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-500">Feil: {(q.error as Error).message}</div>;

  const events = toArray(q.data);

  // If the shape was unexpected, show a small debug so we can see what API returned.
  const looksOdd = !Array.isArray(q.data) && !Array.isArray((q.data as any)?.items) && !Array.isArray((q.data as any)?.content);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Events (Admin)</h1>

      {looksOdd && (
        <pre className="p-3 rounded bg-neutral-900/50 text-xs overflow-auto">
{JSON.stringify(q.data, null, 2)}
        </pre>
      )}

      {events.length === 0 ? (
        <div>Ingen events ennå.</div>
      ) : (
        <ul className="divide-y divide-neutral-800 border border-neutral-800 rounded">
          {events.map((e) => (
            <li key={e.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-neutral-400">{e.slug}</div>
              </div>
              <div className="text-sm">
                {e.isPublished ? (
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Publisert</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">Utkast</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
