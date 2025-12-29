import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Images, Megaphone, Users, MessageSquare } from "lucide-react";

import { listAdminEvents, type Page } from "../../lib/events";
import { listAlbumsAdmin } from "../../lib/albums";
import { listAdminAdverts } from "../../lib/advert";
import { listMemberships } from "../../lib/membership";
import { listSuggestionsAdmin } from "../../lib/suggestions";

function cardBase() {
  return "rounded-2xl border border-white/10 bg-[rgba(10,18,36,.55)] shadow-[0_16px_40px_rgba(0,0,0,.35)] p-5 hover:-translate-y-[1px] transition";
}

export default function AdminDashboard() {
  // Events (Page)
  const qEvents = useQuery({
    queryKey: ["dash.events"],
    queryFn: () => listAdminEvents(0, 1),
  });

  // Albums (array or page)
  const qAlbums = useQuery({
    queryKey: ["dash.albums"],
    queryFn: () => listAlbumsAdmin(),
  });

  // Adverts (Page)
  const qAdverts = useQuery({
    queryKey: ["dash.adverts"],
    queryFn: () => listAdminAdverts(0, 1),
  });

  // Memberships (Page)
  const qMembers = useQuery({
    queryKey: ["dash.members"],
    queryFn: () => listMemberships(0, 1),
  });

  // Suggestions (Page)
  const qSuggestions = useQuery({
    queryKey: ["dash.suggestions"],
    queryFn: () => listSuggestionsAdmin(0, 1),
  });

  const eventsCount = (qEvents.data as Page<any> | undefined)?.totalElements ?? (qEvents.data as any)?.content?.length ?? 0;

  const albumsData: any = qAlbums.data;
  const albumsCount =
    Array.isArray(albumsData) ? albumsData.length : (albumsData?.totalElements ?? albumsData?.content?.length ?? 0);

  const advertsCount = (qAdverts.data as any)?.totalElements ?? (qAdverts.data as any)?.content?.length ?? 0;
  const membersCount = (qMembers.data as any)?.totalElements ?? (qMembers.data as any)?.content?.length ?? 0;
  const suggestionsCount = (qSuggestions.data as any)?.totalElements ?? (qSuggestions.data as any)?.content?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,.18),rgba(16,185,129,.10))] p-6 shadow-[0_20px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-white/70">Welcome back</div>
            <h1 className="text-3xl font-extrabold">ULAN Admin Dashboard</h1>
            <p className="text-white/70 mt-1">
              Quick overview and shortcuts to manage content.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/events"
              className="rounded-xl px-4 py-2 border border-white/10 bg-white/10 hover:bg-white/15 transition"
            >
              Manage events
            </Link>
            <Link
              to="/albums"
              className="rounded-xl px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Manage albums
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Kpi title="Events" value={eventsCount} icon={<Calendar size={18} />} to="/events" />
        <Kpi title="Albums" value={albumsCount} icon={<Images size={18} />} to="/albums" />
        <Kpi title="Adverts" value={advertsCount} icon={<Megaphone size={18} />} to="/adverts" />
        <Kpi title="Members" value={membersCount} icon={<Users size={18} />} to="/membership" />
        <Kpi title="Suggestions" value={suggestionsCount} icon={<MessageSquare size={18} />} to="/suggestions" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cardBase()}>
          <div className="text-sm text-white/70">Quick actions</div>
          <div className="mt-3 grid gap-2">
            <Link className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 transition" to="/events">
              + Create / publish events
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 transition" to="/albums">
              + Create albums & upload media
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 transition" to="/adverts">
              + Add adverts (image/video)
            </Link>
          </div>
        </div>

        <div className={cardBase()}>
          <div className="text-sm text-white/70">Tips</div>
          <div className="mt-3 text-white/80 leading-relaxed">
            • Keep cover images optimized (webp). <br />
            • Publish only verified content. <br />
            • Check “Suggestions” weekly.
          </div>
        </div>

        <div className={cardBase()}>
          <div className="text-sm text-white/70">System status</div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-white/80">API</div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/40 text-emerald-200">
              OK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon,
  to,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/10 bg-[rgba(10,18,36,.55)] p-5 shadow-[0_16px_40px_rgba(0,0,0,.35)] hover:-translate-y-[1px] transition"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">{title}</div>
        <div className="text-white/70 group-hover:text-white transition">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs text-white/60">Open</div>
    </Link>
  );
}
