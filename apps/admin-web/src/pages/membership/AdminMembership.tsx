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
import { Users, UserPlus, Eye, Pencil, Trash2, X, Check, XCircle, RotateCcw, Clock, Mail, Phone, MapPin, CreditCard } from "lucide-react";

/* ---------- Style constants ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5`;
const btnGhost = `${btnBase} border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 px-3 py-2`;
const btnSuccess = `${btnBase} border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-2`;
const btnDanger = `${btnBase} bg-red-600/90 hover:bg-red-600 text-white px-3 py-2`;
const btnSmall = "px-2.5 py-1.5 text-sm";
const inputBase = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-white/40";
const cardBase = "rounded-2xl border border-white/10 bg-[rgba(10,18,36,0.5)]";

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
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
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
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Membership</h1>
        <p className="text-white/60 text-sm mt-1">Manage applications and members</p>
      </div>

      {/* Applications Section */}
      <section className={`${cardBase} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={18} className="text-white/60" />
            Applications
          </h2>

          <div className="flex gap-1 p-1 rounded-xl bg-white/5">
            {(["PENDING", "REJECTED", "ACCEPTED"] as AppTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {qApps.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : qApps.isError ? (
            <div className="text-red-400 text-center py-4">Could not load applications</div>
          ) : apps.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              No applications in this category
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {a.firstName} {a.lastName}
                        </span>
                        <span className="text-sm text-white/50">
                          • {fmtDate(a.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/70">
                        {a.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={12} className="text-white/50" />
                            {a.email}
                          </span>
                        )}
                        {a.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-white/50" />
                            {a.phone}
                          </span>
                        )}
                        {a.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-white/50" />
                            {a.city}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <CreditCard size={12} className="text-white/50" />
                        <span className="text-white/70">Vipps ref:</span>
                        <span className="font-semibold">{a.vippsReference ?? "—"}</span>
                        <span className="text-white/50">({a.vippsAmountNok ?? "—"} NOK)</span>
                      </div>

                      {a.status === "REJECTED" && a.deleteAt && (
                        <div className="text-xs text-white/50 mt-2">
                          Auto-deletes: {fmtDate(a.deleteAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {a.status === "PENDING" ? (
                        <>
                          <button
                            className={`${btnSuccess} ${btnSmall}`}
                            onClick={() => mAccept.mutate(a.id)}
                            disabled={mAccept.isPending}
                          >
                            <Check size={14} />
                            <span className="hidden sm:inline">Accept</span>
                          </button>
                          <button
                            className={`${btnDanger} ${btnSmall}`}
                            onClick={() => {
                              setRejectDays(7);
                              setRejecting(a);
                            }}
                            disabled={mReject.isPending}
                          >
                            <XCircle size={14} />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </>
                      ) : (
                        <button
                          className={`${btnGhost} ${btnSmall}`}
                          onClick={() => mBackToPending.mutate(a.id)}
                          disabled={mBackToPending.isPending}
                        >
                          <RotateCcw size={14} />
                          <span>Undo</span>
                        </button>
                      )}
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          a.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : a.status === "REJECTED"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Members Section */}
      <section className={`${cardBase} overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={18} className="text-white/60" />
            Members
            <span className="text-sm text-white/50 font-normal">({members.length})</span>
          </h2>
          <button className={btnGhost} onClick={() => setEditing({})}>
            <UserPlus size={16} />
            <span>Add member</span>
          </button>
        </div>

        <div className="p-4">
          {qMembers.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : qMembers.isError ? (
            <div className="text-red-400 text-center py-4">Could not load members</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-white/20 mb-2" />
              <p className="text-white/50">No members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {m.firstName} {m.lastName}
                        </span>
                        <span className="text-sm text-white/50">
                          • Joined {fmtDate(m.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/70">
                        {m.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={12} className="text-white/50" />
                            {m.email}
                          </span>
                        )}
                        {m.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-white/50" />
                            {m.phone}
                          </span>
                        )}
                        {m.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-white/50" />
                            {m.city}
                          </span>
                        )}
                      </div>

                      {m.vippsReference && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <CreditCard size={12} className="text-white/50" />
                          <span className="text-white/70">Vipps:</span>
                          <span className="font-mono text-xs">#{m.vippsReference}</span>
                          <span className="text-white/50">({m.vippsAmountNok ?? "—"} NOK)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className={`${btnGhost} ${btnSmall}`}
                        onClick={() => setViewing(m)}
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        className={`${btnGhost} ${btnSmall}`}
                        onClick={() => setEditing(m)}
                      >
                        <Pencil size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        className={`${btnDanger} ${btnSmall}`}
                        onClick={() => {
                          if (confirm(`Delete member "${m.firstName} ${m.lastName}"?`)) {
                            mDelete.mutate(m.id!);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      {viewing && <ViewMemberModal member={viewing} onClose={() => setViewing(null)} />}

      {editing && (
        <EditMemberModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (data.id) {
              mUpdate.mutate({ id: data.id, data });
            } else {
              mCreate.mutate(data);
            }
            setEditing(null);
          }}
        />
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

/* ---------- View Member Modal ---------- */
function ViewMemberModal({
  member,
  onClose,
}: {
  member: MemberDTO;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold">Member Details</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ViewField label="First name" value={member.firstName} />
          <ViewField label="Last name" value={member.lastName} />
          <ViewField label="Date of birth" value={member.dateOfBirth} />
          <ViewField label="Personal number" value={member.personalNr} />
          <ViewField label="Address" value={member.address} />
          <ViewField label="Post code" value={member.postCode} />
          <ViewField label="City" value={member.city} />
          <ViewField label="Phone" value={member.phone} />
          <ViewField label="Email" value={member.email} />
          <ViewField label="Occupation" value={member.occupation} />
          <ViewField label="Vipps Reference" value={member.vippsReference} />
          <ViewField label="Vipps Amount" value={member.vippsAmountNok ? `${member.vippsAmountNok} NOK` : undefined} />
          <ViewField label="Joined" value={member.createdAt ? fmtDate(member.createdAt) : undefined} />
        </div>

        <div className="flex justify-end p-5 border-t border-white/10">
          <button className={btnGhost} onClick={onClose}>
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
      <div className="text-sm text-white/50">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

/* ---------- Reject Modal ---------- */
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold">Reject Application</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="font-semibold">
              {app.firstName} {app.lastName}
            </div>
            <div className="text-sm text-white/70 mt-1">{app.email}</div>
            <div className="text-sm mt-2">
              <span className="text-white/50">Vipps ref:</span>{" "}
              <span className="font-semibold">{app.vippsReference}</span>{" "}
              <span className="text-white/50">({app.vippsAmountNok} NOK)</span>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm text-white/70">Keep in rejected list for</span>
            <select
              className={inputBase}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[1, 3, 7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d} className="bg-[#0b1527]">
                  {d} days
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={btnDanger} onClick={onConfirm}>
            <XCircle size={16} />
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Edit Member Modal ---------- */
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
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0b1527] border border-white/15 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold">{m.id ? "Edit Member" : "New Member"}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          <Field label="First name *" value={m.firstName ?? ""} onChange={set("firstName")} />
          <Field label="Last name *" value={m.lastName ?? ""} onChange={set("lastName")} />
          <Field label="Date of birth" type="date" value={m.dateOfBirth ?? ""} onChange={set("dateOfBirth")} />
          <Field label="Personal number" value={m.personalNr ?? ""} onChange={set("personalNr")} />
          <Field label="Address" value={m.address ?? ""} onChange={set("address")} />
          <Field label="Post code" value={m.postCode ?? ""} onChange={set("postCode")} />
          <Field label="City" value={m.city ?? ""} onChange={set("city")} />
          <Field label="Phone" value={m.phone ?? ""} onChange={set("phone")} />
          <Field label="Email *" type="email" value={m.email ?? ""} onChange={set("email")} />
          <Field label="Occupation" value={m.occupation ?? ""} onChange={set("occupation")} />
          <Field label="Vipps Reference" value={m.vippsReference ?? ""} onChange={set("vippsReference")} />
          <Field label="Vipps Amount (NOK)" type="number" value={m.vippsAmountNok?.toString() ?? ""} onChange={setNumber("vippsAmountNok")} />
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            className={btnPrimary}
            onClick={() => onSave(m)}
            disabled={!m.firstName || !m.lastName || !m.email}
          >
            {m.id ? "Save changes" : "Create member"}
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
    <label className="block space-y-1.5">
      <span className="text-sm text-white/70">{label}</span>
      <input className={inputBase} type={type} value={value ?? ""} onChange={onChange} />
    </label>
  );
}