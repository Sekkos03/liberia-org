// Offentlig API for innsendte medlemskapssøknader
// Bruker samme API_BASE som resten av public-web

const LOCAL_API = 'http://localhost:8080';
const PROD_API  = 'https://liberia-org.onrender.com';
const API_BASE  = window.location.hostname === 'localhost' ? LOCAL_API : PROD_API;

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
