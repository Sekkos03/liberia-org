// admin-web/src/pages/events/AdminEvents.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "../../lib/api";
import { useState } from "react";

type EventDto = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  isPublished: boolean;
};

export default function AdminEvents() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => apiGet<EventDto[]>("/api/admin/events"),
  });

  const [draft, setDraft] = useState<Partial<EventDto>>({
    title: "",
    slug: "",
    startAt: new Date().toISOString(),
  });

  const createM = useMutation({
    mutationFn: (body: any) => apiPost<EventDto>("/api/admin/events", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const publishM = useMutation({
    mutationFn: (id: number) => apiPut(`/api/admin/events/${id}/publish?value=true`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const deleteM = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  if (q.isLoading) return <div>Laster…</div>;
  if (q.isError) return <div className="text-red-600">{(q.error as Error).message}</div>;

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Events (Admin)</h1>

      <form
        className="grid gap-2 border rounded p-3"
        onSubmit={(e) => {
          e.preventDefault();
          createM.mutate(draft);
        }}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span>Tittel</span>
            <input className="border rounded px-2 py-1"
              value={draft.title ?? ""} onChange={e=>setDraft(d=>({ ...d, title: e.target.value }))}/>
          </label>
          <label className="grid gap-1">
            <span>Slug</span>
            <input className="border rounded px-2 py-1"
              value={draft.slug ?? ""} onChange={e=>setDraft(d=>({ ...d, slug: e.target.value }))}/>
          </label>
          <label className="grid gap-1">
            <span>Start (ISO)</span>
            <input className="border rounded px-2 py-1"
              value={draft.startAt ?? ""} onChange={e=>setDraft(d=>({ ...d, startAt: e.target.value }))}/>
          </label>
          <label className="grid gap-1">
            <span>Sted</span>
            <input className="border rounded px-2 py-1"
              value={draft.location ?? ""} onChange={e=>setDraft(d=>({ ...d, location: e.target.value }))}/>
          </label>
        </div>
        <button className="bg-black text-white rounded px-3 py-2 w-max" disabled={createM.isPending}>
          {createM.isPending ? "Lagrer…" : "Opprett"}
        </button>
      </form>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 border">Tittel</th>
            <th className="p-2 border">Slug</th>
            <th className="p-2 border">Start</th>
            <th className="p-2 border">Publisert</th>
            <th className="p-2 border">Handling</th>
          </tr>
        </thead>
        <tbody>
          {q.data!.map((e) => (
            <tr key={e.id}>
              <td className="p-2 border">{e.title}</td>
              <td className="p-2 border">{e.slug}</td>
              <td className="p-2 border">{new Date(e.startAt).toLocaleString()}</td>
              <td className="p-2 border">{e.isPublished ? "Ja" : "Nei"}</td>
              <td className="p-2 border space-x-2">
                {!e.isPublished && (
                  <button className="underline" onClick={() => publishM.mutate(e.id)}>
                    Publiser
                  </button>
                )}
                <button className="text-red-600 underline" onClick={() => deleteM.mutate(e.id)}>
                  Slett
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
