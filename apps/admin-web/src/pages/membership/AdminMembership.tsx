// admin-web/src/pages/membership/AdminMembership.tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getMembershipFormSettings,
  saveMembershipFormSettings,
  listMembershipApplications,
  type MembershipFormSettings,
} from "../../lib/membership";
import { useState } from "react";

export default function AdminMembership() {
  const qSettings = useQuery({
    queryKey: ["membershipSettings"],
    queryFn: getMembershipFormSettings,
  });

  const mSave = useMutation({
    mutationFn: (payload: MembershipFormSettings) =>
      saveMembershipFormSettings(payload),
  });

  const qApps = useQuery({
    queryKey: ["membershipApps", 0],
    queryFn: () => listMembershipApplications(0, 25),
    // Hvis backend ikke har endpointet enda, la feil være "stille"
    retry: false,
  });

  const [url, setUrl] = useState("");

  // sync inn felt når settings kommer
  if (qSettings.data && url === "") {
    setTimeout(() => setUrl(qSettings.data!.url), 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Membership (Admin)</h1>
      </div>

      {qSettings.isLoading ? (
        <div>Laster innstillinger…</div>
      ) : qSettings.isError ? (
        <div className="text-red-500">
          {(qSettings.error as Error).message}
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mSave.mutate({ url });
          }}
        >
          <label className="block">
            <div className="mb-1 text-sm opacity-80">Google Forms URL</div>
            <input
              className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 outline-none focus:ring"
              placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mSave.isPending}
              className="rounded-lg px-4 py-2 border border-white/15 hover:bg-white/5"
            >
              {mSave.isPending ? "Lagrer…" : "Lagre"}
            </button>
          </div>

          {url && (
            <div className="mt-4">
              <div className="mb-2 text-sm opacity-80">Forhåndsvisning</div>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <iframe
                  title="Google form preview"
                  src={url}
                  className="w-full"
                  style={{ height: 740 }}
                />
              </div>
            </div>
          )}
        </form>
      )}

      <hr className="border-white/10" />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Siste søknader</h2>
        {qApps.isLoading ? (
          <div>Laster søknader…</div>
        ) : qApps.isError ? (
          <div className="text-sm opacity-70">
            (Ingen lokal liste tilgjengelig ennå.)
          </div>
        ) : (
          <ul className="space-y-2">
            {(qApps.data?.content ?? []).map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/10 p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">
                    {a.firstName} {a.lastName}
                  </div>
                  <div className="text-sm opacity-70">{a.email}</div>
                </div>
                <div className="text-sm opacity-70">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
            {(qApps.data?.content?.length ?? 0) === 0 && (
              <div className="text-sm opacity-70">Ingen søknader.</div>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
