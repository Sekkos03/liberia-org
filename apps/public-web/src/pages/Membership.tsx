import { useMemo, useState, useRef } from "react";
import vippsImg from "../assets/vipps.jpeg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  MEMBERSHIP_FEE_NOK,
  checkAlreadyMember,
  submitMembership,
  type MembershipForm,
} from "../lib/membership";
import DonationPopup from "../components/Donationpopup";

const VIPPS_NUMBER = "75356";
const VIPPS_RECEIVER = "ULAN";

type Step = 1 | 2;

export default function Membership() {
  const [step, setStep] = useState<Step>(1);
  const formStartRef = useRef<HTMLDivElement>(null);

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

    vippsAmountNok: String(MEMBERSHIP_FEE_NOK),
    vippsReference: "",
    vippsConfirmed: false,
  });

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update =
    (k: keyof MembershipForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [k]: value as any }));
      setErrors((x) => ({ ...x, [k]: "" }));
    };

  const progress = useMemo(() => {
    const filled =
      step === 1
        ? countFilledStep1(form)
        : countFilledStep1(form) + countFilledStep2(form);

    // 8 required fields in step 1 (personalNr is now optional) + 3 in step 2 = 11 total
    const total = step === 1 ? 8 : 11;
    return Math.round((filled / total) * 100);
  }, [form, step]);

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    // personalNr is now optional - removed from required fields
    const req: (keyof MembershipForm)[] = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "address",
      "postCode",
      "city",
      "phone",
      "email",
    ];

    for (const k of req) {
      if (!(form[k] ?? "").toString().trim()) e[k] = "Required field";
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email address";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    const amount = Number((form.vippsAmountNok || "").replace(",", "."));

    if (!Number.isFinite(amount) || amount !== MEMBERSHIP_FEE_NOK) {
      e.vippsAmountNok = `Amount must be ${MEMBERSHIP_FEE_NOK} NOK`;
    }
    if (!form.vippsReference.trim()) e.vippsReference = "Enter Vipps transaction reference";
    if (!form.vippsConfirmed) e.vippsConfirmed = "You must confirm that you have paid";

    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  }

  async function onNext() {
    setErr(null);
    if (!validateStep1()) return;

    setSaving(true);
    try {
      const exists = await checkAlreadyMember({
        email: form.email.trim(),
        personalNr: form.personalNr.trim() || "", // Allow empty personalNr
      });
      if (exists) {
        setErr("You are already a member.");
        return;
      }
      setStep(2);
    } catch (e: any) {
      setErr(e?.message ?? "Could not check membership status.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitFinal(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!validateStep2()) {
      setErr("Please complete the Vipps payment section before submitting.");
      return;
    }

    setSaving(true);
    try {
      await submitMembership(form);
      setDone(true);
    } catch (ex: any) {
      setErr(ex?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      personalNr: "",
      address: "",
      postCode: "",
      city: "",
      phone: "",
      email: "",
      vippsAmountNok: String(MEMBERSHIP_FEE_NOK),
      vippsReference: "",
      vippsConfirmed: false,
    });
    setStep(1);
    setDone(false);
    setErr(null);
    setErrors({});
    // Scroll to top after state updates
    setTimeout(() => {
      formStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900/30 to-slate-900/0">
      <Navbar />

      <div className="relative h-44 md:h-56 w-full bg-[#122346]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08),_rgba(18,35,70,0.95))]" />
        <div className="relative h-full max-w-5xl mx-auto px-4 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-4xl font-extrabold">
            ULAN Membership Application
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-4 pb-16 -mt-20 w-full">
        <div ref={formStartRef} className="rounded-2xl bg-white text-gray-900 shadow-xl overflow-hidden">
          <div className="h-2 bg-[#122346]" />

          <div className="p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Step <b>{step}</b> of <b>2</b>
              </p>
              <p className="text-sm text-gray-600">
                Progress: <b>{progress}%</b>
              </p>
            </div>

            {err && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                <div className="font-semibold">Error</div>
                <div className="text-sm mt-1">{err}</div>
              </div>
            )}

            {done && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <div className="text-emerald-900 font-extrabold text-lg">
                      Application submitted successfully
                    </div>
                    <div className="text-emerald-800 text-sm mt-1">
                      Your application is now under review. You will receive an email once it is approved.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!done ? (
            <form className="p-6 md:p-8 space-y-5" onSubmit={onSubmitFinal} noValidate>
              {step === 1 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="First name" required value={form.firstName} onChange={update("firstName")} error={errors.firstName} />
                    <Input label="Last name" required value={form.lastName} onChange={update("lastName")} error={errors.lastName} />
                  </div>

                  <Input label="Date of birth" type="date" required value={form.dateOfBirth} onChange={update("dateOfBirth")} error={errors.dateOfBirth} />
                  <Input 
                    label="Personal number (last 5 digits) — optional" 
                    value={form.personalNr} 
                    onChange={update("personalNr")} 
                    error={errors.personalNr}
                  />
                  <Input label="Address" required value={form.address} onChange={update("address")} error={errors.address} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Post code" required value={form.postCode} onChange={update("postCode")} error={errors.postCode} />
                    <Input label="City" required value={form.city} onChange={update("city")} error={errors.city} />
                  </div>

                  <Input label="Phone number" required value={form.phone} onChange={update("phone")} error={errors.phone} />
                  <Input label="Email" type="email" required value={form.email} onChange={update("email")} error={errors.email} />

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Never send passwords via this form.</p>

                    <button
                      type="button"
                      onClick={onNext}
                      disabled={saving}
                      className="inline-flex items-center rounded-lg bg-[#122346] text-white px-6 py-2.5 font-medium shadow hover:opacity-95 disabled:opacity-60 transition-opacity"
                    >
                      {saving ? "Checking…" : "Next"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-gray-200 p-5 bg-[#f7fbff]">
                    <div className="text-lg font-extrabold text-[#122346]">
                      Pay {MEMBERSHIP_FEE_NOK} NOK with Vipps
                    </div>

                    <div className="mt-2 text-sm text-gray-700">
                      Scan the QR code or use Vipps number: <b>{VIPPS_NUMBER}</b> ({VIPPS_RECEIVER})
                    </div>

                    <div className="mt-4 rounded-xl overflow-hidden border bg-white">
                      <img
                        src={vippsImg}
                        alt="Vipps QR"
                        className="w-full h-[360px] object-contain bg-white block"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <Input
                        label="Amount (NOK)"
                        required
                        value={form.vippsAmountNok}
                        onChange={update("vippsAmountNok")}
                        error={errors.vippsAmountNok}
                      />
                      <Input
                        label="Vipps transaction reference"
                        required
                        value={form.vippsReference}
                        onChange={update("vippsReference")}
                        error={errors.vippsReference}
                        helpText="You can find the transaction reference in the Vipps app under payment history. This helps admin verify your payment so your membership can be approved."
                      />
                    </div>

                    <label className="flex items-start gap-3 mt-4">
                      <input
                        type="checkbox"
                        checked={form.vippsConfirmed}
                        onChange={update("vippsConfirmed")}
                        className="mt-1 h-4 w-4"
                      />
                      <span className="text-sm text-gray-800">
                        I confirm that I have paid {MEMBERSHIP_FEE_NOK} NOK with Vipps.
                        <span className="text-red-600"> *</span>
                        {errors.vippsConfirmed && (
                          <span className="block text-[12px] text-red-600 mt-1">
                            {errors.vippsConfirmed}
                          </span>
                        )}
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={saving}
                      className="rounded-lg border px-5 py-2.5 font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-lg bg-[#122346] text-white px-6 py-2.5 font-medium shadow hover:opacity-95 disabled:opacity-60 transition-opacity"
                    >
                      {saving ? "Submitting…" : "Submit application"}
                    </button>
                  </div>
                </>
              )}

              <div className="mt-3">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Page {step} of 2</div>
              </div>
            </form>
          ) : (
            <div className="p-6 md:p-8">
              <button
                className="rounded-lg bg-[#122346] text-white px-6 py-2.5 font-medium shadow hover:opacity-95 transition-opacity"
                onClick={resetForm}
              >
                Back to start
              </button>
            </div>
          )}
        </div>
      </div>
      <DonationPopup />
      <Footer />
    </div>
  );
}

// Count filled required fields only (personalNr is optional now)
function countFilledStep1(form: MembershipForm) {
  const keys: (keyof MembershipForm)[] = [
    "firstName","lastName","dateOfBirth","address","postCode","city","phone","email"
  ];
  return keys.filter(k => (form[k] ?? "").toString().trim().length > 0).length;
}

function countFilledStep2(form: MembershipForm) {
  let c = 0;
  if ((form.vippsAmountNok ?? "").toString().trim()) c++;
  if ((form.vippsReference ?? "").toString().trim()) c++;
  if (form.vippsConfirmed) c++;
  return c;
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  required,
  error,
  helpText,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  helpText?: string;
}) {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <label className="block">
      <div className="mb-1 text-[13px] text-gray-700 flex items-center gap-1.5">
        {label} {required && <span className="text-red-600">*</span>}
        {helpText && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowHelp(!showHelp);
              }}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#122346] text-white text-[10px] font-bold hover:bg-[#1a3461] transition-colors cursor-help"
              aria-label="Show help"
            >
              ?
            </button>
            {showHelp && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowHelp(false)}
                />
                <div className="absolute right-0 top-6 z-50 w-72 bg-[#122346] text-white text-xs rounded-lg shadow-lg">
                  <div className="absolute -top-1.5 right-2 w-3 h-3 bg-[#122346] rotate-45" />
                  <div className="relative p-3 pt-4">
                    <span
                      role="button"
                      tabIndex={0}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowHelp(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setShowHelp(false);
                        }
                      }}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/30 transition-colors cursor-pointer select-none"
                      aria-label="Close"
                    >
                      ×
                    </span>
                    <p className="leading-relaxed pr-4">{helpText}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <input
        className={`w-full rounded-lg border px-3 py-2.5 outline-none transition
          ${error ? "border-red-400 focus:ring-2 ring-red-300" : "border-gray-300 focus:border-[#122346] focus:ring-2 ring-[#a6b0c7]"}
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