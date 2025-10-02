import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
  type MemberDTO,
} from "../../lib/membership";

export default function AdminMembership() {
  const qMembers = useQuery({
    queryKey: ["members", 0],
    queryFn: () => listMemberships(0, 50),
  });

  const mCreate = useMutation({
    mutationFn: createMembership,
    onSuccess: () => qMembers.refetch(),
  });
  const mUpdate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberDTO }) => updateMembership(id, data),
    onSuccess: () => qMembers.refetch(),
  });
  const mDelete = useMutation({
    mutationFn: (id: number) => deleteMembership(id),
    onSuccess: () => qMembers.refetch(),
  });

  const [editing, setEditing] = useState<MemberDTO | null>(null);
  const members = useMemo(() => qMembers.data?.content ?? [], [qMembers.data]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-4xl font-extrabold">Membership (Admin)</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Medlemmer</h2>
          <button
            className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5"
            onClick={() => setEditing({})}
          >
            Ny registrering
          </button>
        </div>

        {qMembers.isLoading ? (
          <div>Laster…</div>
        ) : qMembers.isError ? (
          <div className="text-red-500">Kunne ikke hente medlemmer</div>
        ) : members.length === 0 ? (
          <div className="opacity-70">Ingen registreringer enda.</div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="rounded-xl border border-white/10 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {m.firstName} {m.lastName}
                  </div>
                  <div className="text-sm opacity-70 truncate">
                    {m.email} · {m.phone} · {m.city}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                    onClick={() => setEditing(m)}
                  >
                    Rediger
                  </button>
                  <button
                    className="rounded-lg px-3 py-1 border border-red-500/40 text-red-300 hover:bg-red-500/10"
                    onClick={() => mDelete.mutate(m.id!)}
                  >
                    Slett
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <EditMemberModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) mUpdate.mutate({ id: editing.id, data });
            else mCreate.mutate(data);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditMemberModal({
  initial,
  onClose,
  onSave,
}: {
  initial: MemberDTO;
  onClose: () => void;
  onSave: (data: MemberDTO) => void;
}) {
  const [m, setM] = useState<MemberDTO>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    personalNr: "",
    address: "",
    postCode: "",
    city: "",
    phone: "",
    email: "",
    ...initial,
  });
  const set = (k: keyof MemberDTO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setM((x) => ({ ...x, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-black p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{m.id ? "Rediger medlem" : "Ny registrering"}</h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="First Name" value={m.firstName ?? ""} onChange={set("firstName")} />
          <Field label="Second Name" value={m.lastName ?? ""} onChange={set("lastName")} />
          <Field label="Date of Birth" type="date" value={m.dateOfBirth ?? ""} onChange={set("dateOfBirth")} />
          <Field label="Personal-Nr" value={m.personalNr ?? ""} onChange={set("personalNr")} />
          <Field label="Address" value={m.address ?? ""} onChange={set("address")} />
          <Field label="Post Code" value={m.postCode ?? ""} onChange={set("postCode")} />
          <Field label="City" value={m.city ?? ""} onChange={set("city")} />
          <Field label="Telefon Nummer" value={m.phone ?? ""} onChange={set("phone")} />
          <Field label="E-Mail" type="email" value={m.email ?? ""} onChange={set("email")} />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5">
            Avbryt
          </button>
          <button onClick={() => onSave(m)} className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5">
            Lagre
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 opacity-80 text-sm">{label}</div>
      <input
        className="w/full rounded-xl bg-transparent border border-white/15 px-3 py-2 outline-none focus:border-violet-500"
        type={type}
        value={value ?? ""}
        onChange={onChange}
      />
    </label>
  );
}
