import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
  listMembershipApplications,
  acceptMembershipApplication,
  rejectMembershipApplication,
  setMembershipApplicationPending,
  type MemberDTO,
  type MembershipApplicationDTO,
} from "../../lib/membership";

type AppTab = "PENDING" | "REJECTED" | "ACCEPTED";

function toDate(input: string | number | null | undefined) {
  if (!input) return null;
  if (typeof input === "number") {
    return new Date(input < 1e12 ? input * 1000 : input);
  }
  return new Date(input);
}

function fmtDate(input: string | number | null | undefined) {
  const d = toDate(input);
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMembership() {
  const qMembers = useQuery({
    queryKey: ["members", 0],
    queryFn: () => listMemberships(0, 50),
  });

  const [tab, setTab] = useState<AppTab>("PENDING");
  const qApps = useQuery({
    queryKey: ["membershipApplications", tab],
    queryFn: () => listMembershipApplications(tab, 0, 50),
  });

  const mAccept = useMutation({
    mutationFn: (id: number) => acceptMembershipApplication(id),
    onSuccess: () => {
      qMembers.refetch();
      qApps.refetch();
    },
  });

  const mReject = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      rejectMembershipApplication(id, days),
    onSuccess: () => qApps.refetch(),
  });

  const mBackToPending = useMutation({
    mutationFn: (id: number) => setMembershipApplicationPending(id),
    onSuccess: () => {
      qMembers.refetch();
      setTab("PENDING");
      qApps.refetch();
    },
  });

  const mCreate = useMutation({
    mutationFn: createMembership,
    onSuccess: () => qMembers.refetch(),
  });

  const mUpdate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberDTO }) =>
      updateMembership(id, data),
    onSuccess: () => qMembers.refetch(),
  });

  const mDelete = useMutation({
    mutationFn: (id: number) => deleteMembership(id),
    onSuccess: () => qMembers.refetch(),
  });

  const [editing, setEditing] = useState<MemberDTO | null>(null);
  const [viewing, setViewing] = useState<MemberDTO | null>(null);

  const [rejecting, setRejecting] = useState<MembershipApplicationDTO | null>(null);
  const [rejectDays, setRejectDays] = useState(7);

  const apps = useMemo(() => qApps.data?.content ?? [], [qApps.data]);
  const members = useMemo(() => qMembers.data?.content ?? [], [qMembers.data]);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold">Membership (Admin)</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Applications</h2>

          <div className="flex gap-2">
            <TabButton active={tab === "PENDING"} onClick={() => setTab("PENDING")}>
              Pending
            </TabButton>
            <TabButton active={tab === "REJECTED"} onClick={() => setTab("REJECTED")}>
              Rejected
            </TabButton>
            <TabButton active={tab === "ACCEPTED"} onClick={() => setTab("ACCEPTED")}>
              Accepted
            </TabButton>
          </div>
        </div>

        {qApps.isLoading ? (
          <div>Loading applications…</div>
        ) : qApps.isError ? (
          <div className="text-red-500">Could not load applications</div>
        ) : apps.length === 0 ? (
          <div className="opacity-70">No applications in this category.</div>
        ) : (
          <ul className="space-y-2">
            {apps.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/10 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {a.firstName} {a.lastName}
                    <span className="text-sm opacity-60"> • {fmtDate(a.createdAt)}</span>
                  </div>

                  <div className="text-sm opacity-80 truncate">
                    {a.email ?? "–"} {a.phone ? ` • ${a.phone}` : ""} {a.city ? ` • ${a.city}` : ""}
                  </div>

                  <div className="text-sm mt-1">
                    <span className="opacity-70">Vipps ref:</span>{" "}
                    <span className="font-semibold">{a.vippsReference ?? "–"}</span>{" "}
                    <span className="opacity-60">({a.vippsAmountNok ?? "–"} NOK)</span>
                  </div>

                  {a.status === "REJECTED" && a.deleteAt && (
                    <div className="text-xs opacity-70 mt-1">
                      Auto-deletes: {fmtDate(a.deleteAt)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {a.status === "PENDING" ? (
                    <>
                      <button
                        className="rounded-lg px-3 py-1 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                        onClick={() => mAccept.mutate(a.id)}
                        disabled={mAccept.isPending}
                      >
                        Accept
                      </button>

                      <button
                        className="rounded-lg px-3 py-1 border border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                        onClick={() => {
                          setRejectDays(7);
                          setRejecting(a);
                        }}
                        disabled={mReject.isPending}
                      >
                        Reject
                      </button>

                      <span className="rounded-md px-2 py-1 text-sm border border-white/10 opacity-80">
                        {a.status}
                      </span>
                    </>
                  ) : (
                    <>
                      <button
                        className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                        onClick={() => mBackToPending.mutate(a.id)}
                        disabled={mBackToPending.isPending}
                      >
                        Angre
                      </button>

                      <span className="rounded-md px-2 py-1 text-sm border border-white/10 opacity-80">
                        {a.status}
                      </span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Members</h2>
          <button
            className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5"
            onClick={() => setEditing({})}
          >
            New member (manual)
          </button>
        </div>

        {qMembers.isLoading ? (
          <div>Loading members…</div>
        ) : qMembers.isError ? (
          <div className="text-red-500">Could not load members</div>
        ) : members.length === 0 ? (
          <div className="opacity-70">No members found.</div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-white/10 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {m.firstName} {m.lastName}
                    <span className="text-sm opacity-60"> • Joined {fmtDate(m.createdAt)}</span>
                  </div>
                  <div className="text-sm opacity-70 truncate">
                    {m.email} {m.phone ? ` • ${m.phone}` : ""} {m.city ? ` • ${m.city}` : ""}
                  </div>
                  {m.vippsReference && (
                    <div className="text-xs opacity-60 mt-1">
                      Vipps: {m.vippsReference} ({m.vippsAmountNok} NOK)
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="rounded-lg px-3 py-1 border border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                    onClick={() => setViewing(m)}
                  >
                    View
                  </button>
                  <button
                    className="rounded-lg px-3 py-1 border border-white/15 hover:bg-white/5"
                    onClick={() => setEditing(m)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg px-3 py-1 border border-red-500/40 text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (confirm(`Delete member ${m.firstName} ${m.lastName}?`)) {
                        mDelete.mutate(m.id!);
                      }
                    }}
                  >
                    Delete
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

      {viewing && (
        <ViewMemberModal member={viewing} onClose={() => setViewing(null)} />
      )}

      {rejecting && (
        <RejectModal
          app={rejecting}
          days={rejectDays}
          setDays={setRejectDays}
          onClose={() => setRejecting(null)}
          onConfirm={() => {
            mReject.mutate({ id: rejecting.id, days: rejectDays });
            setRejecting(null);
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg px-3 py-2 border " +
        (active ? "border-white/30 bg-white/10" : "border-white/15 hover:bg-white/5")
      }
    >
      {children}
    </button>
  );
}

function ViewMemberModal({ member, onClose }: { member: MemberDTO; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-black p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Member Details</h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ViewField label="First name" value={member.firstName} />
          <ViewField label="Last name" value={member.lastName} />
          <ViewField label="Date of birth" value={member.dateOfBirth} />
          <ViewField label="Personal number" value={member.personalNr} />
          <ViewField label="Address" value={member.address} />
          <ViewField label="Post code" value={member.postCode} />
          <ViewField label="City" value={member.city} />
          <ViewField label="Phone number" value={member.phone} />
          <ViewField label="Email" value={member.email} />
          <ViewField label="Occupation" value={member.occupation} />
          <ViewField label="Vipps Reference" value={member.vippsReference} />
          <ViewField label="Vipps Amount" value={member.vippsAmountNok ? `${member.vippsAmountNok} NOK` : undefined} />
          <ViewField label="Joined" value={member.createdAt ? fmtDate(member.createdAt) : undefined} />
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <div className="text-sm opacity-60">{label}</div>
      <div className="font-medium">{value || "–"}</div>
    </div>
  );
}

function RejectModal({
  app,
  days,
  setDays,
  onClose,
  onConfirm,
}: {
  app: MembershipApplicationDTO;
  days: number;
  setDays: (n: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-black p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Reject application</h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        <div className="text-sm opacity-80">
          <div className="font-semibold">
            {app.firstName} {app.lastName}
          </div>
          <div>{app.email}</div>
          <div className="mt-1">
            Vipps ref: <b>{app.vippsReference}</b> ({app.vippsAmountNok} NOK)
          </div>
        </div>

        <label className="block">
          <div className="mb-1 opacity-80 text-sm">Keep in rejected list for (days)</div>
          <select
            className="w-full rounded-xl bg-transparent border border-white/15 px-3 py-2 outline-none"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[1, 3, 7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d} className="bg-black">
                {d} days
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-3 py-2 border border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
          >
            Reject
          </button>
        </div>
      </div>
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
    occupation: "",
    vippsReference: "",
    vippsAmountNok: undefined,
    ...initial,
  });

  const set = (k: keyof MemberDTO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setM((x) => ({ ...x, [k]: e.target.value }));

  const setNumber = (k: keyof MemberDTO) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    setM((x) => ({ ...x, [k]: val }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-black p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{m.id ? "Edit member" : "New member"}</h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="First name *" value={m.firstName ?? ""} onChange={set("firstName")} />
          <Field label="Last name *" value={m.lastName ?? ""} onChange={set("lastName")} />
          <Field
            label="Date of birth"
            type="date"
            value={m.dateOfBirth ?? ""}
            onChange={set("dateOfBirth")}
          />
          <Field label="Personal number" value={m.personalNr ?? ""} onChange={set("personalNr")} />
          <Field label="Address" value={m.address ?? ""} onChange={set("address")} />
          <Field label="Post code" value={m.postCode ?? ""} onChange={set("postCode")} />
          <Field label="City" value={m.city ?? ""} onChange={set("city")} />
          <Field label="Phone number" value={m.phone ?? ""} onChange={set("phone")} />
          <Field label="Email *" type="email" value={m.email ?? ""} onChange={set("email")} />
          <Field label="Occupation" value={m.occupation ?? ""} onChange={set("occupation")} />
          <Field
            label="Vipps Reference"
            value={m.vippsReference ?? ""}
            onChange={set("vippsReference")}
          />
          <Field
            label="Vipps Amount (NOK)"
            type="number"
            value={m.vippsAmountNok?.toString() ?? ""}
            onChange={setNumber("vippsAmountNok")}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(m)}
            className="rounded-lg px-3 py-2 border border-white/15 hover:bg-white/5"
            disabled={!m.firstName || !m.lastName || !m.email}
          >
            Save
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
        className="w-full rounded-xl bg-transparent border border-white/15 px-3 py-2 outline-none focus:border-violet-500"
        type={type}
        value={value ?? ""}
        onChange={onChange}
      />
    </label>
  );
}