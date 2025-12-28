import { useEffect, useMemo, useState, type JSX } from "react";
import { Link } from "react-router-dom";
import { getEvents, type EventDto } from "../lib/events";
import { toPublicUrl } from "../lib/media";

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

        const data = await getEvents();
        if (!alive) return;

        data.sort((a, b) => +new Date(a.startAt!) - +new Date(b.startAt!));
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
    const future = events.filter((e) => new Date(e.startAt!) >= now);
    const past = events
      .filter((e) => new Date(e.startAt!) < now)
      .sort((a, b) => +new Date(b.startAt!) - +new Date(a.startAt!));

    const sortedFuture = [...future].sort((a, b) => +new Date(a.startAt!) - +new Date(b.startAt!));
    const next = sortedFuture[0] ?? null;
    const upcoming = sortedFuture.slice(1);

    return { next, upcoming, past };
  }, [events, now]);

  if (loading) return <div className="py-10 text-center">Loading…</div>;
  if (err) return <div className="py-10 text-center text-red-600">{err}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[#13244d] mb-6">Planned Activities</h1>

      {/* Next event */}
      {next ? (
        <NextEventCard event={next} />
      ) : (
        <div className="border rounded-xl p-6 bg-white">No upcoming events.</div>
      )}

      {/* Upcoming */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-[#13244d] mb-4">Coming soon</h2>

        {upcoming.length ? (
          <div className="grid md:grid-cols-2 gap-6">
            {upcoming.map((e) => (
              <UpcomingCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No more upcoming events.</div>
        )}
      </div>

      {/* Past */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-[#13244d] mb-4">Previous</h2>

        {past.length ? (
          <div className="grid md:grid-cols-2 gap-6">
            {past.map((e) => (
              <PastCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No previous events.</div>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          to="/events/calendar"
          className="inline-flex items-center gap-2 rounded-full bg-[#142754] text-white px-6 py-3 shadow"
        >
          <span className="inline-block">📅</span>
          Open calendar
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ Components ------------------------------ */

function NextEventCard({ event }: { event: EventDto }) {
  const cover = coverSrc(event);

  return (
    <div className="rounded-2xl border shadow-sm bg-white overflow-hidden">
      <div className="grid md:grid-cols-5 gap-0">
        {/* Cover / fallback gradient */}
        <div className="md:col-span-2">
          <div
            className="h-48 md:h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#0f1e3d] to-[#213b6b]"
            style={{
              backgroundImage: cover
                ? `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('${cover}')`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Info */}
        <div className="md:col-span-3 p-6">
          <div className="inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-[#eef4ff] text-[#13244d] mb-3">
            Next event
          </div>

          <h3 className="text-3xl font-extrabold text-[#13244d]">{event.title}</h3>

          <div className="mt-3 flex flex-wrap gap-3 items-center">
            <div className="border rounded-lg px-4 py-2 bg-[#f6fbff]">
              <div className="text-xs uppercase tracking-wide text-gray-500">{formatMonth(event.startAt!)}</div>
              <div className="text-xl font-bold text-[#13244d] leading-tight">{formatDay(event.startAt!)}</div>
              <div className="text-xs text-gray-600">
                {formatYear(event.startAt!)} • {formatTime(event.startAt!)}
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-[#13244d] bg-[#f6fbff] border rounded-full px-4 py-2">
              <span>📍</span>
              {event.location ?? "TBA"}
            </div>
          </div>

          <p className="mt-4 text-gray-700">{event.summary ?? ""}</p>

          <Link
            to={`/events/${event.slug}`}
            className="mt-4 inline-flex items-center font-bold text-[#13244d] hover:underline"
          >
            Find out more ›
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpcomingCard({ event }: { event: EventDto }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="border rounded-lg px-4 py-2 bg-[#f6fbff] mb-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          {formatMonth(event.startAt!)} {formatDay(event.startAt!)} {formatYear(event.startAt!)} • {formatTime(event.startAt! )}
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-[#13244d]">{event.title}</h3>
      <div className="mt-2 text-sm text-gray-700">
        {formatTime(event.startAt!)} • {event.location ?? "TBA"}
      </div>

      <Link to={`/events/${event.slug}`} className="mt-4 inline-flex font-bold text-[#13244d] hover:underline">
        Find out more ›
      </Link>
    </div>
  );
}

function PastCard({ event }: { event: EventDto }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm opacity-90">
      <div className="border rounded-lg px-4 py-2 bg-[#f6fbff] mb-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          {formatMonth(event.startAt!)} {formatDay(event.startAt!)} {formatYear(event.startAt!)} • {formatTime(event.startAt!)}
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-[#13244d]">{event.title}</h3>
      <div className="mt-2 text-sm text-gray-700">
        {formatTime(event.startAt!)} • {event.location ?? "TBA"}
      </div>

      <Link to={`/events/${event.slug}`} className="mt-4 inline-flex font-bold text-[#13244d] hover:underline">
        Find out more ›
      </Link>
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

function formatMonth(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short" }).toUpperCase();
}
function formatDay(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: "2-digit" });
}
function formatYear(iso: string) {
  return new Date(iso).toLocaleString(undefined, { year: "numeric" });
}

function coverSrc(e: EventDto): string | null {
  if (!e.coverImageUrl) return null;
  const u = toPublicUrl(e.coverImageUrl);
  return u || null;
}
