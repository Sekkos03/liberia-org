const LOCAL_API = "http://localhost:8080";
const PROD_API = "https://liberia-org.onrender.com";
const API_BASE = window.location.hostname === "localhost" ? LOCAL_API : PROD_API;

export const MEMBERSHIP_FEE_NOK = 245;

export type MembershipForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // yyyy-mm-dd
  personalNr: string;
  address: string;
  postCode: string;
  city: string;
  phone: string;
  email: string;

  // Vipps
  vippsAmountNok: string;      // "300"
  vippsReference: string;      // kvittering / melding
  vippsConfirmed: boolean;     // må være true
};

export async function checkAlreadyMember(args: {
  email: string;
  personalNr: string;
}): Promise<boolean> {
  // ✅ Backend bør lage denne: GET /api/membership/exists?email=...&personalNr=...
  // Returner { exists: true/false }
  const url =
    `${API_BASE}/api/membership/exists?email=${encodeURIComponent(args.email)}` +
    `&personalNr=${encodeURIComponent(args.personalNr)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });

  // Hvis du ikke har laget endpoint enda, ikke blokker flyten:
  if (res.status === 404) return false;

  if (!res.ok) throw new Error("Could not check membership status");
  const data = (await res.json()) as { exists: boolean };
  return !!data.exists;
}

export async function submitMembership(payload: MembershipForm): Promise<void> {
  const res = await fetch(`${API_BASE}/api/membership/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) return;

  if (res.status === 409) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Du er allerede medlem.");
  }

  const msg = await res.text().catch(() => "");
  throw new Error(msg || "Kunne ikke sende søknaden");
}
