import { useQuery } from "@tanstack/react-query";
import { Navigate , Link, useParams } from "react-router-dom";
import { apiGet } from "../lib/events";
import type { EventDto } from "./Events";
import { useEffect, useMemo, useState, type JSX } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function EventDetail() {
  const { slug } = useParams();
if (slug === "calendar") {
  return <Navigate to="/events/calendar" replace />;
}

  const q = useQuery({
    queryKey: ["event", slug],
    queryFn: () => apiGet<EventDto>(`/api/events/${slug}`),
  });

  if (q.isLoading) return <div className="max-w-5xl mx-auto px-4 py-16">Laster…</div>;
  if (q.isError) {
    const msg = (q.error as Error)?.message ?? "Ukjent feil";
    return <div className="max-w-5xl mx-auto px-4 py-16 text-red-500">Feil: {msg}</div>;
  }

  const e = q.data!;

  return (
    <article className="max-w-5xl mx-auto px-4 pb-20">
      {/* Cover */}
      {e.coverImageUrl && (
        <div className="rounded-xl overflow-hidden shadow mb-6">
          <img src={e.coverImageUrl} alt={e.title} className="w-full h-80 object-cover" />
        </div>
      )}

      {/* Tittel + meta */}
      <h1 className="text-3xl font-bold">{e.title}</h1>
      <p className="text-gray-600 mt-1">
        {formatDate(e.startAt)}{e.location ? ` · ${e.location}` : ""}
      </p>
      
      // ...inne i komponenten etter tittel/meta:
        {(e as any).galleryAlbumId && (
        <div className="mt-4">
            <Link
            to={`/photos/${(e as any).galleryAlbumId}`}
            className="inline-flex items-center rounded-md bg-[#16254a] text-white px-4 py-2 hover:opacity-95"
            >
            Se bilder og videoer fra dette eventet
            </Link>
        </div>
        )}


      {/* Countdown liten strippe */}
      <div className="mt-4 flex gap-3">
        <Badge label="DAYS" value={<CountdownPiece target={e.startAt} part="days" />} />
        <Badge label="HOURS" value={<CountdownPiece target={e.startAt} part="hours" />} />
        <Badge label="MIN" value={<CountdownPiece target={e.startAt} part="minutes" />} />
        <Badge label="SEC" value={<CountdownPiece target={e.startAt} part="seconds" />} />
      </div>

      {/* Beskrivelse */}
      {e.description && (
        <div
          className="prose max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: e.description }}
        />
      )}

      {/* Navigasjon / kalenderknapp */}
      <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
  <Link to="/events" className="text-[#16254a] hover:underline">
    ← Til liste
  </Link>
  <div className="flex gap-2">
    <Link
      to="/events/calendar"
      className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
    >
      Åpne kalender
    </Link>
    <Link
      to="/events"
      className="inline-flex items-center rounded-md bg-[#16254a] text-white px-4 py-2 hover:opacity-95"
    >
      Se alle planlagte aktiviteter
    </Link>
  </div>
</div>

    </article>
  );
}

/* småbiter */
function Badge({ label, value }: { label: string; value: JSX.Element }) {
  return (
    <div className="px-3 py-2 rounded-md bg-[#16254a] text-white text-sm">
      <span className="font-semibold mr-1">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

function CountdownPiece({ target, part }: { target: string; part: "days"|"hours"|"minutes"|"seconds" }) {
  const targetDate = new Date(target);
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
  return <span suppressHydrationWarning>{String(map[part]).padStart(2, "0")}</span>;
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
