import { http, type Page } from "./events";

/* --------------------------------- Members -------------------------------- */
export type MemberDTO = {
  id?: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  personalNr?: string;
  address?: string;
  postCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  vippsReference?: string;
  vippsAmountNok?: number;
  createdAt?: string;
};

export async function listMemberships(page = 0, size = 50) {
  const res = await http.get<Page<MemberDTO>>("/api/admin/membership", { params: { page, size } });
  return res.data;
}

export async function getMembership(id: number) {
  const res = await http.get<MemberDTO>(`/api/admin/membership/${id}`);
  return res.data;
}

export async function createMembership(body: MemberDTO) {
  const res = await http.post<MemberDTO>("/api/admin/membership", body);
  return res.data;
}

export async function updateMembership(id: number, body: MemberDTO) {
  const res = await http.put<MemberDTO>(`/api/admin/membership/${id}`, body);
  return res.data;
}

export async function deleteMembership(id: number) {
  await http.delete(`/api/admin/membership/${id}`);
}

/* -------------------------- Membership Applications ------------------------- */

export type MembershipApplicationDTO = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  personalNr?: string | null;
  address?: string | null;
  postCode?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  occupation?: string | null;
  vippsReference?: string | null;
  vippsAmountNok?: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt?: string | null;
  handledAt?: string | null;
  deleteAt?: string | null;
};

export async function listMembershipApplications(
  status: "PENDING" | "ACCEPTED" | "REJECTED",
  page = 0,
  size = 50
) {
  const res = await http.get<Page<MembershipApplicationDTO>>("/api/admin/membership/applications", {
    params: { status, page, size },
  });
  return res.data;
}

export async function acceptMembershipApplication(id: number) {
  const res = await http.patch(`/api/admin/membership/applications/${id}/accept`);
  return res.data;
}

export async function rejectMembershipApplication(id: number, daysToKeep: number) {
  const res = await http.patch(`/api/admin/membership/applications/${id}/reject`, { daysToKeep });
  return res.data;
}

export async function setMembershipApplicationPending(id: number) {
  const res = await http.patch(`/api/admin/membership/applications/${id}/pending`);
  return res.data;
}