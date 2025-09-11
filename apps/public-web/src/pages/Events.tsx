import { useEffect, useMemo, useState, type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/events";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlannedActivities from "../components/PlannedActivities";
import { toPublicUrl } from "../lib/media";

/** API-modell */
export type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  startAt: string; // ISO
  endAt?: string | null; // ISO
  galleryAlbumId?: number | null;
};

export default function Events() {
  const q = useQuery({
    queryKey: ["events"],
    queryFn: () => apiGet<EventDto[]>("/api/events"),
  });

  if (q.isLoading) return <div className="max-w-6xl mx-auto px-4 py-16">Laster…</div>;
  if (q.isError) {
    const msg = (q.error as Error)?.message ?? "Ukjent feil";
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-red-500">
        Feil: {msg}
      </div>
    );
  }

  const events = (q.data ?? []).slice().sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const now = new Date();
  const upcoming = events.filter(e => new Date(e.startAt) >= now);
  const past = events.filter(e => new Date(e.startAt) < now).reverse();
  const next = upcoming[0];

  return (
     <div id="events-page" className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pb-24">
        <section className="max-w-6xl mx-auto px-4 pt-6">
          <div className="bg-[#16254a] rounded-xl shadow border border-[#0f1b3a] text-white h-64 md:h-72 relative overflow-hidden">
            {next?.coverImageUrl && (
              <img
                src={toPublicUrl(next.coverImageUrl)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-between px-6 text-2xl opacity-70">
              <span>‹</span>
              <span>›</span>
            </div>
            <div className="absolute inset-0 grid place-items-center text-sm opacity-90">
              Photos of something
            </div>
          </div>
        </section>

        {/* NESTE EVENT – kort med countdown */}
        <section className="max-w-3xl mx-auto px-4 mt-8">
          <div className="rounded-xl shadow-lg overflow-hidden border border-[#0f1b3a] bg-[#16254a] text-white">
            <div className="px-6 pt-6 text-center">
              <h2 className="text-xl font-bold">Next Upcoming Event</h2>
              {next ? (
                <>
                  <p className="mt-2 text-[13px] tracking-wide opacity-90">
                    {next.title}
                  </p>
                  <p className="mt-1 text-[13px] opacity-75">
                    {formatDate(next.startAt)}{next.location ? ` · ${next.location}` : ""}
                  </p>
                  <div className="mt-4 flex items-stretch justify-center gap-3">
                    <TimeBox label="DAYS" value={<CountdownPiece target={next.startAt} part="days" />} />
                    <TimeBox label="HOURS" value={<CountdownPiece target={next.startAt} part="hours" />} />
                    <TimeBox label="MIN" value={<CountdownPiece target={next.startAt} part="minutes" />} />
                    <TimeBox label="SEC" value={<CountdownPiece target={next.startAt} part="seconds" />} />
                  </div>
                  <div className="py-6">
                    <Link
                      to={`/events/${next.slug}`}
                      className="inline-block bg-black/70 hover:bg-black text-white rounded-md px-5 py-2 text-sm"
                    >
                      FIND OUT MORE
                    </Link>
                  </div>
                </>
              ) : (
                <p className="py-8 opacity-80">Ingen kommende arrangement.</p>
              )}
            </div>
          </div>
        </section>

        {/* LISTE: Kommer / Tidligere (+ kalenderknapp inni PlannedActivities) */}
        <section className="mt-16">
          <PlannedActivities /> 
        </section>

        {/* NB: Ikke legg knappen her – vi flytter den i PlannedActivities slik at den kommer
            mellom “Tidligere” og footer. main har ekstra padding nederst for luft. */}
      </main>

      <Footer />
    </div>
  );
}

/* ---------- Småkomponenter ----------- */

function TimeBox({ label, value }: { label: string; value: JSX.Element }) {
  return (
    <div className="w-16 h-16 rounded bg-black/70 grid place-items-center">
      <div className="text-center">
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-[10px] opacity-75 mt-1">{label}</div>
      </div>
    </div>
  );
}

function CountdownPiece({ target, part }: { target: string; part: "days"|"hours"|"minutes"|"seconds" }) {
  const targetDate = useMemo(() => new Date(target), [target]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = +targetDate - +new Date();
  if (diff <= 0) return <span>0</span>;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const map = { days: d, hours: h, minutes: m, seconds: s };
  const val = map[part];
  return <span suppressHydrationWarning>{String(val).padStart(2, "0")}</span>;
}

function formatDate(iso: string) {
  const dt = new Date(iso);
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
