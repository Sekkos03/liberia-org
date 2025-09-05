// public-web/src/pages/Membership.tsx
import { useQuery } from "@tanstack/react-query";
import { getPublicMembershipForm } from "../lib/membership";

export default function Membership() {
  const q = useQuery({
    queryKey: ["publicMembershipForm"],
    queryFn: getPublicMembershipForm,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Bli medlem</h1>

      {q.isLoading ? (
        <div>Laster…</div>
      ) : q.isError ? (
        <div className="text-red-500">
          {(q.error as Error).message ?? "Kunne ikke hente skjema"}
        </div>
      ) : !q.data?.url ? (
        <div className="text-sm opacity-70">
          Skjema er ikke tilgjengelig akkurat nå.
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <iframe
            title="Membership form"
            src={q.data.url}
            className="w-full"
            style={{ height: 900 }}
          />
        </div>
      )}
    </div>
  );
}
