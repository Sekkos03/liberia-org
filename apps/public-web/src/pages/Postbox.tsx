import { type FormEvent, useState } from "react";
import { submitSuggestion } from "../lib/postbox";

export default function Postbox() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!message.trim()) {
      setErr("Melding kan ikke være tom.");
      return;
    }

    try {
      setBusy(true);
      await submitSuggestion({ name: name.trim() || undefined, email: email.trim() || undefined, message });
      setSent(true);
      setMessage("");
      setName("");
      setEmail("");
    } catch (e: any) {
      setErr(e.message ?? "Noe gikk galt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold">Postbox – send oss et forslag</h1>

      {sent && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 px-4 py-3 text-emerald-200">
          Takk! Forslaget er sendt. 💌
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-red-400/30 bg-red-900/20 px-4 py-3 text-red-200">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm opacity-80 mb-1">Navn (valgfritt)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-black/20 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ditt navn"
            />
          </div>
          <div>
            <label className="block text-sm opacity-80 mb-1">E-post (valgfritt)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg bg-black/20 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              placeholder="din@epost.no"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm opacity-80 mb-1">Melding *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full rounded-lg bg-black/20 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
            placeholder="Skriv forslaget ditt her…"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/5 disabled:opacity-60"
          >
            Send inn
          </button>
          <button
            type="button"
            onClick={() => {
              setName(""); setEmail(""); setMessage(""); setErr(null);
            }}
            className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
          >
            Tøm
          </button>
        </div>
      </form>

      <p className="opacity-70 text-sm">
        Vi lagrer forslaget ditt og går gjennom det så snart som mulig. Personopplysninger er
        valgfrie—legg dem bare ved hvis du ønsker svar.
      </p>
    </div>
  );
}
