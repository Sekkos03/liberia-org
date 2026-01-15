import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/events";
import Navbar from "../components/Navbar";
import axios from "axios";
import Footer from "../components/Footer";

type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  startAt: string;
  endAt?: string | null;
};

type ViewMode = "month" | "list" | "day";

export default function EventsCalendar() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [current, setCurrent] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState<ViewMode>("month");
  const [query, setQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await axios.get(`${API_BASE}/api/events`, { withCredentials: false });
        const data: EventDto[] = res.data;
        if (alive) setEvents(data.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)));
      } catch (e: any) {
        if (alive) setErr(e.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventDto[]>();
    for (const e of events) {
      const k = dayKey(new Date(e.startAt));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current));
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) out.push(addDays(start, i));
    return out;
  }, [current]);

  const currentMonthKey = monthKey(current);

  const onSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const hit = events.find((ev) => ev.title.toLowerCase().includes(q));
    if (!hit) return;
    const d = new Date(hit.startAt);
    setCurrent(startOfMonth(d));
    setSelectedDay(truncateDay(d));
    setView("month");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4 pt-4 sm:pt-6 pb-8 sm:pb-16">
        {/* Search + Controls */}
        <form onSubmit={onSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border rounded-md px-3 py-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="opacity-60">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for events"
              className="flex-1 outline-none bg-transparent text-sm"
            />
          </div>
          
          <button type="submit" className="px-4 py-2 rounded-md bg-[#1f2a44] text-white text-sm whitespace-nowrap">
            Find Events
          </button>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => {
                setCurrent(startOfMonth(new Date()));
                setSelectedDay(null);
              }}
              className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 whitespace-nowrap"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrent(addMonths(current, -1));
                setSelectedDay(null);
              }}
              className="px-2 py-1.5 text-lg rounded border hover:bg-gray-50"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="px-3 py-1.5 text-sm rounded border bg-white whitespace-nowrap">
              {current.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrent(addMonths(current, 1));
                setSelectedDay(null);
              }}
              className="px-2 py-1.5 text-lg rounded border hover:bg-gray-50"
              aria-label="Next month"
            >
              ›
            </button>

            <div className="ml-2 flex rounded-md overflow-hidden border">
              <Toggle on={() => setView("list")} active={view === "list"}>
                List
              </Toggle>
              <Toggle on={() => setView("month")} active={view === "month"}>
                Month
              </Toggle>
              <Toggle on={() => setView("day")} active={view === "day"}>
                Today
              </Toggle>
            </div>
          </div>
        </form>

        {/* Mobile Controls */}
        <div className="lg:hidden mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrent(startOfMonth(new Date()));
                setSelectedDay(null);
              }}
              className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 whitespace-nowrap"
            >
              This Month
            </button>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setCurrent(addMonths(current, -1));
                  setSelectedDay(null);
                }}
                className="px-2 py-1.5 text-lg rounded border hover:bg-gray-50"
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="px-3 py-1.5 text-sm rounded border bg-white whitespace-nowrap">
                {current.toLocaleString(undefined, { month: "short", year: "numeric" })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrent(addMonths(current, 1));
                  setSelectedDay(null);
                }}
                className="px-2 py-1.5 text-lg rounded border hover:bg-gray-50"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          <div className="flex rounded-md overflow-hidden border w-full">
            <Toggle on={() => setView("list")} active={view === "list"}>
              List
            </Toggle>
            <Toggle on={() => setView("month")} active={view === "month"}>
              Month
            </Toggle>
            <Toggle on={() => setView("day")} active={view === "day"}>
              Today
            </Toggle>
          </div>
        </div>

        {/* Content */}
        <section className="mt-4 sm:mt-6">
          {loading && <div className="text-gray-500">Loading…</div>}
          {err && <div className="text-red-600">Error: {err}</div>}

          {!loading && !err && view === "month" && (
            <MonthView
              days={days}
              currentMonthKey={currentMonthKey}
              eventsByDay={eventsByDay}
              selectedDay={selectedDay}
              onSelectDay={(d) => {
                setSelectedDay(d);
                setView("day");
              }}
            />
          )}

          {!loading && !err && view === "list" && (
            <ListView
              month={current}
              events={events.filter((e) => sameMonth(new Date(e.startAt), current))}
            />
          )}

          {!loading && !err && view === "day" && (
            <DayView
              day={selectedDay ?? truncateDay(new Date())}
              events={eventsByDay.get(dayKey(selectedDay ?? new Date())) ?? []}
            />
          )}
        </section>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#16254a] text-white shadow-lg hover:shadow-xl transition-transform duration-150 hover:-translate-y-0.5 w-full sm:w-auto"
          >
            Back to Events
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ---------------- Views ---------------- */

function MonthView({
  days,
  currentMonthKey,
  eventsByDay,
  selectedDay,
  onSelectDay,
}: {
  days: Date[];
  currentMonthKey: string;
  eventsByDay: Map<string, EventDto[]>;
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="hidden sm:grid grid-cols-7 bg-gray-50 text-[11px] font-medium text-gray-500">
        {weekDays.map((w) => (
          <div key={w} className="px-3 py-2">
            {w}
          </div>
        ))}
      </div>

      {/* Mobile: Show abbreviated days */}
      <div className="grid sm:hidden grid-cols-7 bg-gray-50 text-[10px] font-medium text-gray-500">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
          <div key={i} className="px-1 py-2 text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const k = dayKey(d);
          const dim = monthKey(d) !== currentMonthKey;
          const isSel = selectedDay && sameDay(d, selectedDay);
          const list = eventsByDay.get(k) ?? [];
          
          return (
            <div
              key={k}
              className={`h-16 sm:h-28 border p-1 sm:p-2 text-xs relative cursor-pointer ${
                dim ? "bg-gray-50 text-gray-400" : ""
              } ${isSel ? "ring-2 ring-[#1f2a44]" : ""}`}
              onClick={() => onSelectDay(truncateDay(d))}
            >
              <div className="absolute top-0.5 sm:top-1 right-1 sm:right-2 text-[10px] sm:text-[11px] opacity-70">
                {d.getDate()}
              </div>
              
              {/* Desktop: Show event details */}
              <div className="hidden sm:flex mt-5 flex-col gap-1">
                {list.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.slug}`}
                    className="truncate px-2 py-0.5 rounded bg-[#eaf1ff] text-[#1f2a44] hover:bg-[#dce8ff]"
                  >
                    {timeOf(e.startAt)} · {e.title}
                  </Link>
                ))}
                {list.length > 3 && (
                  <span className="text-[11px] text-gray-500">+{list.length - 3} more</span>
                )}
              </div>
              
              {/* Mobile: Show dot indicators */}
              <div className="sm:hidden flex flex-wrap gap-0.5 mt-3 justify-center">
                {list.slice(0, 4).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1f2a44]" />
                ))}
                {list.length > 4 && (
                  <div className="text-[8px] text-gray-600">+</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ month, events }: { month: Date; events: EventDto[] }) {
  return (
    <div className="space-y-3">
      {events.length === 0 && <div className="text-gray-500">No events this month.</div>}
      {events.map((e) => (
        <Link
          key={e.id}
          to={`/events/${e.slug}`}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:shadow"
        >
          <div className="w-full sm:w-24 h-12 sm:h-16 rounded bg-[#eaf1ff] grid place-items-center text-[#1f2a44] font-semibold">
            <div className="leading-none text-xl sm:text-2xl">{new Date(e.startAt).getDate()}</div>
            <div className="text-[10px] uppercase">
              {new Date(e.startAt).toLocaleString(undefined, { month: "short" })}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base">{e.title}</div>
            <div className="text-xs sm:text-sm text-gray-600 truncate">
              {timeOf(e.startAt)} · {new Date(e.startAt).toLocaleDateString()}{" "}
              {e.location ? `· ${e.location}` : ""}
            </div>
            {e.summary && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">{e.summary}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function DayView({ day, events }: { day: Date; events: EventDto[] }) {
  return (
    <div>
      <div className="text-base sm:text-lg font-semibold">
        {day.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
      
      <div className="mt-3 space-y-3">
        {events.length === 0 && <div className="text-gray-500">No events for this date.</div>}
        {events.map((e) => (
          <Link
            key={e.id}
            to={`/events/${e.slug}`}
            className="block p-3 sm:p-4 border rounded-lg hover:shadow"
          >
            <div className="font-medium text-sm sm:text-base">{e.title}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {timeOf(e.startAt)} {e.location ? `· ${e.location}` : ""}
            </div>
            {e.summary && <p className="text-xs sm:text-sm text-gray-600 mt-1">{e.summary}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function Toggle(props: { active?: boolean; on: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.on}
      className={`flex-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm ${
        props.active ? "bg-[#1f2a44] text-white" : "bg-white hover:bg-gray-50"
      }`}
    >
      {props.children}
    </button>
  );
}

/* ---------------- Date helpers ---------------- */

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function truncateDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return truncateDay(a).getTime() === truncateDay(b).getTime();
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function dayKey(d: Date) {
  const x = truncateDay(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}