import { useMemo, useState } from "react";
import { submitMembership, type MembershipForm } from "../lib/membership";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/** Skjemaet er designet med samme “kort i midten + progressbar”-følelse
 *  som eksempelet du viste. Fargene er de samme som på forsiden. */
export default function Membership() {
  const [form, setForm] = useState<MembershipForm>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    personalNr: "",
    address: "",
    postCode: "",
    city: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const required: (keyof MembershipForm)[] = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "personalNr",
    "address",
    "postCode",
    "city",
    "phone",
    "email",
  ];

  const update =
    (k: keyof MembershipForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setErrors((x) => ({ ...x, [k]: "" }));
    };

  const progress = useMemo(() => {
    const filled = required.filter((k) => (form[k] ?? "").trim()).length;
    return Math.round((filled / required.length) * 100);
  }, [form]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    for (const k of required) if (!(form[k] ?? "").trim()) e[k] = "Påkrevd";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Ugyldig e-post";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr(null);
    if (!validate()) return;

    setSaving(true);
    try {
      await submitMembership(form);
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Noe gikk galt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-slate-900/30 to-slate-900/0">
      <Navbar />
      {/* Hero-felt med mørk blå bakgrunn (som på forsiden) */}
      <div className="relative h-44 md:h-56 w-full bg-[#122346]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08),_rgba(18,35,70,0.95))]" />
        <div className="relative h-full max-w-5xl mx-auto px-4 flex items-center">
          <div className="text-white">
            <div className="text-sm uppercase tracking-wide opacity-80">Forms</div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              ULAN Membership Registration Form
            </h1>
          </div>
        </div>
      </div>

      {/* Kortet – hvitt, skygge, tynn toppstripe i mørk blå */}
      <div className="max-w-3xl mx-auto px-4 pb-16 -mt-20">
        <div className="rounded-2xl bg-white text-gray-900 shadow-xl overflow-hidden">
          <div className="h-2 bg-[#122346]" />
          <div className="p-6 md:p-8 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">*</span> indikerer at feltet er påkrevd
            </p>
            {err && <div className="mt-3 text-red-600">Feil: {err}</div>}
          </div>

          <form className="p-6 md:p-8 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="First Name" required value={form.firstName} onChange={update("firstName")} error={errors.firstName} />
              <Input label="Second Name" required value={form.lastName} onChange={update("lastName")} error={errors.lastName} />
            </div>

            <Input label="Date of Birth" type="date" required value={form.dateOfBirth} onChange={update("dateOfBirth")} error={errors.dateOfBirth} />
            <Input label="Personal-Nr" required value={form.personalNr} onChange={update("personalNr")} error={errors.personalNr} />
            <Input label="Address" required value={form.address} onChange={update("address")} error={errors.address} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Post Code" required value={form.postCode} onChange={update("postCode")} error={errors.postCode} />
              <Input label="City" required value={form.city} onChange={update("city")} error={errors.city} />
            </div>

            <Input label="Telefon Nummer" required value={form.phone} onChange={update("phone")} error={errors.phone} />
            <Input label="E-Mail" type="email" required value={form.email} onChange={update("email")} error={errors.email} />

            <div className="pt-2 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">Send aldri passord via dette skjemaet.</p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-lg bg-[#122346] text-white px-6 py-2.5 font-medium shadow hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Sender…" : "Send"}
              </button>
            </div>

            {/* Progress som i Google Forms */}
            <div className="mt-3">
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Side 1 av 1</div>
            </div>
          </form>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[13px] text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </div>
      <input
        className={`w-full rounded-lg border px-3 py-2.5 outline-none transition
          ${error ? "border-red-400 focus:ring-2 ring-red-300"
                  : "border-gray-300 focus:border-[#122346] focus:ring-2 ring-[#a6b0c7]"}
          bg-white text-gray-900`}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
      />
      {error && <div className="mt-1 text-[12px] text-red-600">{error}</div>}
    </label>
  );
}
