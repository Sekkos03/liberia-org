// Offentlig API for innsendte medlemskapssøknader
// Bruker samme API_BASE som resten av public-web
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export type MembershipForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;    // ISO (yyyy-mm-dd)
  personalNr: string;
  address: string;
  postCode: string;
  city: string;
  phone: string;
  email: string;
  occupation: string;
};

export async function submitMembership(payload: MembershipForm): Promise<void> {
  const res = await fetch(`${API_BASE}/api/membership/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Kunne ikke sende søknaden");
  }
}
