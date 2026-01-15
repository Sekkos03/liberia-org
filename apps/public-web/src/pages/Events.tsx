import { useEffect, useMemo, useState, type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/events";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlannedActivities from "../components/PlannedActivities";
import { toPublicUrl } from "../lib/media";
import liberianHeadlines from "../assets/Liberian Headlines.png";

export type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  startAt: string;
  endAt?: string | null;
  galleryAlbumId?: number | null;
};

export default function Events() {
  const q = useQuery({
    queryKey: ["events"],
    queryFn: () => apiGet<EventDto[]>("/api/events"),
  });

  if (q.isLoading) return <div className="max-w-6xl mx-auto px-4 py-16">Loading…</div>;
  if (q.isError) {
    const msg = (q.error as Error)?.message ?? "Unknown error";
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-red-500">
        Error: {msg}
      </div>
    );
  }

  const events = (q.data ?? []).slice().sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const now = new Date();
  const upcoming = events.filter(e => new Date(e.startAt) >= now);
  const past = events.filter(e => new Date(e.startAt) < now).reverse();
  const next = upcoming[0];

  return (
    <div className="photos">
      <Navbar />
      <main className="photos__wrap">
        <section className="photosHero" aria-label="Intro">
          <div className="photosHero__banner">
            <img
              src={liberianHeadlines}
              alt="Liberian headlines"
              className="heroBanner__img"
            />
          </div>
          <div className="photosHero__title">EVENTS</div>
        </section>

        {/* Next Event Countdown */}
        <section className="max-w-3xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8">
          <div className="rounded-xl shadow-lg overflow-hidden border border-[#0f1b3a] bg-[#16254a] text-white">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 text-center">
              <h2 className="text-lg sm:text-xl font-bold">Next upcoming event</h2>
              {next ? (
                <>
                  <p className="mt-2 text-xs sm:text-[13px] tracking-wide opacity-90 px-2">
                    {next.title}
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] opacity-75">
                    {formatDate(next.startAt)}{next.location ? ` · ${next.location}` : ""}
                  </p>
                  <div className="mt-4 flex items-stretch justify-center gap-2 sm:gap-3 flex-wrap">
                    <TimeBox label="DAYS" value={<CountdownPiece target={next.startAt} part="days" />} />
                    <TimeBox label="HOURS" value={<CountdownPiece target={next.startAt} part="hours" />} />
                    <TimeBox label="MIN" value={<CountdownPiece target={next.startAt} part="minutes" />} />
                    <TimeBox label="SEC" value={<CountdownPiece target={next.startAt} part="seconds" />} />
                  </div>
                  <div className="py-4 sm:py-6">
                    <Link
                      to={`/events/${next.slug}`}
                      className="inline-block bg-black/70 hover:bg-black text-white rounded-md px-4 sm:px-5 py-2 text-xs sm:text-sm"
                    >
                      FIND OUT MORE
                    </Link>
                  </div>
                </>
              ) : (
                <p className="py-6 sm:py-8 opacity-80">No upcoming events.</p>
              )}
            </div>
          </div>
        </section>

        {/* Planned Activities List */}
        <section className="mt-12 sm:mt-16">
          <PlannedActivities /> 
        </section>
      </main>

      <Footer />
      <style>{css}</style>
    </div>
  );
}

/* ---------- Small Components ----------- */

function TimeBox({ label, value }: { label: string; value: JSX.Element }) {
  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-black/70 grid place-items-center">
      <div className="text-center">
        <div className="text-lg sm:text-xl font-bold leading-none">{value}</div>
        <div className="text-[9px] sm:text-[10px] opacity-75 mt-1">{label}</div>
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

const css = `
:root{
  --navy-900:#0f1d37;
  --navy-800:#15284b;
  --navy-700:#19335e;
  --navy-600:#1e4178;
  --ink:#0b1020;
  --paper:#ffffff;
  --muted:#9fb2cc;
  --teal:#29a3a3;
}

.photos{
  display:flex;
  flex-direction:column;
  min-height:100vh;
  background:#fff;
}

.photos__wrap{
  flex:1;
  width:min(1200px,94vw);
  margin:0 auto;
  padding:20px 0 40px;
}

@media (min-width: 640px) {
  .photos__wrap{
    padding:28px 0 56px;
  }
}

.photosHero{
  position:relative;
  margin:12px 0 24px;
  display:grid;
  place-items:center;
}

@media (min-width: 640px) {
  .photosHero{
    margin:18px 0 36px;
  }
}

.photosHero__banner{
  width:min(1100px,94vw);
  min-height:120px;
  border-radius:12px;
  background:#1e2f53;
  color:#e6eefc;
  display:grid;
  place-items:center;
  box-shadow:0 4px 16px rgba(13,26,46,.18);
  border:2px solid #0e1f3b;
  font-weight:600;
  overflow: hidden;
  height: 160px;
}

@media (min-width: 640px) {
  .photosHero__banner{
    height: 240px;
  }
}

.heroBanner__img{
  width:100%;
  height:100%;
  object-fit:contain;
  background:#fff;
  display:block;
}

.photosHero__title{
  position:relative;
  margin-top:-24px;
  background:#fff;
  color:#111827;
  border-radius:10px;
  padding:12px 20px;
  font-weight:800;
  font-size:18px;
  letter-spacing:.6px;
  border:2px solid #0e1f3b;
  box-shadow:0 6px 20px rgba(12,18,32,.18);
}

@media (min-width: 640px) {
  .photosHero__title{
    margin-top:-36px;
    padding:18px 28px;
    font-size:24px;
  }
}

.photos__loading{
  padding:18px;
  color:#1e2f53;
  font-weight:600;
}

.photos__error{
  padding:14px 16px;
  background:#b91c1c;
  color:#fff;
  border-radius:8px;
  font-weight:700;
}

.folderGrid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0,1fr));
  gap:24px 20px;
  justify-items:center;
  padding:6px 8px 12px;
}

@media (min-width: 640px){
  .folderGrid{
    grid-template-columns:repeat(3, minmax(0,1fr));
    gap:32px 28px;
  }
}

@media (min-width: 1024px){
  .folderGrid{
    grid-template-columns:repeat(4, minmax(0,1fr));
    gap:42px 48px;
  }
}

.folder{
  display:grid;
  justify-items:center;
  text-decoration:none;
  outline:0;
}

.folder:focus .folder__label{
  box-shadow:0 0 0 3px rgba(41,163,163,.45);
  border-radius:6px;
}

.folder__icon{
  width:64px;
  height:50px;
  filter:drop-shadow(0 3px 6px rgba(13,26,46,.25));
}

@media (min-width: 640px){
  .folder__icon{
    width:88px;
    height:68px;
  }
}

.folder__label{
  margin-top:8px;
  font-weight:600;
  color:#111827;
  font-size:12px;
  text-align:center;
  max-width:140px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

@media (min-width: 640px){
  .folder__label{
    margin-top:10px;
    font-size:14px;
    max-width:160px;
  }
}

.fi__top{ fill:#4d78a8; }
.fi__body{ fill:#3a6a9d; }
.fi__gloss{ fill:rgba(255,255,255,.08); }
.folder:hover .fi__top{ fill:#5b86b6; }
.folder:hover .fi__body{ fill:#4477ad; }
`;