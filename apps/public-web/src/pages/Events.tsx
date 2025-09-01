// public-web/src/pages/Events.tsx
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { Link } from "react-router-dom";

export type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  coverImageUrl: string | null;
  rsvpUrl: string | null;
  startAt: string; // ISO OffsetDateTime
  endAt: string | null;
};

export default function Events() {
  const q = useQuery({
    queryKey: ["events"],
    queryFn: () => apiGet<EventDto[]>("/api/events"),
  });

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-600">Feil: {(q.error as Error).message}</div>;
  const items = q.data ?? [];

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Kommende arrangement</h1>
      {items.length === 0 && <div>Ingen publiserte arrangement enda.</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((e) => (
          <article key={e.id} className="border rounded-lg overflow-hidden">
            {e.coverImageUrl && (
              <img src={e.coverImageUrl} alt={e.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-3 space-y-2">
              <h2 className="font-medium">{e.title}</h2>
              {e.summary && <p className="text-sm text-gray-600">{e.summary}</p>}
              <p className="text-xs text-gray-500">
                {new Date(e.startAt).toLocaleString()} {e.location ? `· ${e.location}` : ""}
              </p>
              <Link className="inline-block text-blue-600 text-sm" to={`/events/${e.slug}`}>
                Les mer →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
