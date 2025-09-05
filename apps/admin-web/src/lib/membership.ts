// admin-web/src/lib/membership.ts
// Admin API for Membership (Google Forms-innstillinger + (ev.) innsendte søknader)

import { http, type Page } from "./api";

/* ---------------------------------- Typer --------------------------------- */

export type MembershipFormSettings = {
  url: string;          // Google Forms URL (gjerne med ?embedded=true)
  title?: string;
  description?: string;
};

export type MembershipDTO = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  createdAt: string;    // ISO
};

/* ------------------------------ Admin-endepunkt ---------------------------- */

// Hent Google Forms-innstillinger (krever auth via http-instansen)
export async function getMembershipFormSettings(): Promise<MembershipFormSettings> {
  const res = await http.get<MembershipFormSettings>("/api/admin/membership/form");
  return res.data;
}

// Lagre/oppdater Google Forms-innstillinger
export async function saveMembershipFormSettings(
  input: MembershipFormSettings
): Promise<MembershipFormSettings> {
  const res = await http.put<MembershipFormSettings>("/api/admin/membership/form", input);
  return res.data;
}

// (Valgfritt) Liste av innsendte søknader hvis backend tilbyr dette
export async function listMembershipApplications(
  page = 0,
  size = 50
): Promise<Page<MembershipDTO>> {
  const res = await http.get<Page<MembershipDTO>>("/api/admin/memberships", {
    params: { page, size },
  });
  return res.data;
}
