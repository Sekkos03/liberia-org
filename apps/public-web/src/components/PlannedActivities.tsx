import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/events";

type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  startAt: string; // ISO
  endAt?: string | null;
};

export default function PlannedActivities() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [events, setEvents] = useState<EventDto[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/api/events`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data: EventDto[] = await res.json();
        if (!alive) return;
        data.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
        setEvents(data);
      } catch (e: any) {
        if (alive) setErr(e.message ?? "Failed to fetch");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const now = new Date();

  const { next, upcoming, past } = useMemo(() => {
    const future = events.filter(e => new Date(e.startAt) >= now);
    const past = events
      .filter(e => new Date(e.startAt) < now)
      .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
    const next = future[0] ?? null;
    const upcoming = future.slice(1, 6); // begrens liste
    return { next, upcoming, past };
  }, [events]);

  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-[#1f2a44]">
          Planned Activities
        </h2>

        {loading && <p className="mt-6 text-gray-500">Loading…</p>}
        {err && <p className="mt-6 text-red-600">Error: {err}</p>}

        {!loading && !err && (
          <>
            {/* Featured / Neste event */}
            {next ? (
              <FeaturedCard e={next} />
            ) : (
              <div className="mt-6 p-6 border rounded-xl bg-white shadow-sm">
                <p className="text-gray-600">No upcoming events are planned.</p>
              </div>
            )}

            {/* Kommende (flere) */}
            {upcoming.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Coming soon</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map(e => (
                    <SmallCard key={e.id} e={e} />
                  ))}
                </div>
              </div>
            )}

            {/* Tidligere – tidslinje */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Previous</h3>
              {past.length === 0 ? (
                <p className="text-gray-500">No previous events.</p>
              ) : (
                <ul className="relative border-l pl-5 space-y-5">
                  {past.slice(0, 6).map(e => (
                    <li key={e.id} className="group">
                      <span className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#1f2a44] ring-4 ring-[#eaf1ff]" />
                      <Link
                        to={`/events/${e.slug}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border bg-white hover:shadow-md transition"
                      >
                        <DatePill iso={e.startAt} />
                        <div className="flex-1">
                          <div className="font-medium text-[#0f172a] group-hover:underline">
                            {e.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(e.startAt)}
                            {e.location ? ` · ${e.location}` : ""}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Åpne kalender-knapp: mellom "Tidligere" og footer */}
            <div className="mt-12 flex justify-center">
              <Link
                to="/events/calendar"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#16254a] text-white shadow-lg hover:shadow-xl transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16254a]"
                aria-label="Open calendar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10zM5 14h4v4H5v-4zm6 0h4v4h-4v-4z"
                    fill="currentColor"
                  />
                </svg>
                Open calendar
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------ Sub-komponenter ------------ */

function FeaturedCard({ e }: { e: EventDto }) {
  const d = new Date(e.startAt);
  return (
    <Link
      to={`/events/${e.slug}`}
      className="mt-6 grid md:grid-cols-5 gap-6 p-4 md:p-5 border rounded-2xl bg-white shadow-sm hover:shadow-lg transition"
    >
      {/* Cover / fallback gradient */}
      <div className="md:col-span-2">
        <div
          className="h-48 md:h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#0f1e3d] to-[#213b6b]"
          style={{
            backgroundImage: e.coverImageUrl
              ? `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('${e.coverImageUrl}')`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      {/* Info */}
      <div className="md:col-span-3 flex flex-col">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#1f2a44] bg-[#eaf1ff] px-3 py-1 rounded-full w-fit">
          Next event
        </span>

        <h3 className="mt-3 text-2xl md:text-3xl font-extrabold text-[#0f172a] leading-tight">
          {e.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <DatePill iso={e.startAt} />
          {e.location && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100">
              📍 {e.location}
            </span>
          )}
        </div>

        {e.summary && <p className="mt-3 text-gray-600">{e.summary}</p>}

        <div className="mt-auto pt-4">
          <span className="inline-flex items-center text-[#1f2a44] font-medium">
            Find out more <span className="ml-1">›</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SmallCard({ e }: { e: EventDto }) {
  return (
    <Link
      to={`/events/${e.slug}`}
      className="group rounded-xl border bg-white p-4 hover:shadow-md transition flex flex-col gap-3"
    >
      <DatePill iso={e.startAt} />
      <div className="font-semibold text-[#0f172a] group-hover:underline">{e.title}</div>
      <div className="text-sm text-gray-600">
        {formatTime(e.startAt)}
        {e.location ? ` · ${e.location}` : ""}
      </div>
    </Link>
  );
}

function DatePill({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleString(undefined, { month: "short" });
  const day = d.getDate().toString().padStart(2, "0");
  const year = d.getFullYear();
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-[#f7fbff]">
      <span className="grid place-items-center text-center leading-tight">
        <span className="text-xs uppercase text-[#1f2a44]">{month}</span>
        <span className="text-lg font-extrabold text-[#0f172a] -mt-0.5">{day}</span>
      </span>
      <span className="text-xs text-gray-600">{year}</span>
      <span className="text-xs text-gray-400">•</span>
      <span className="text-xs text-gray-700">{formatTime(iso)}</span>
    </div>
  );
}

/* ------------ Helpers ------------ */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
