import { http, type Page } from "./events";

/* --------------------------------- Members -------------------------------- */
export type MemberDTO = {
  id?: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // yyyy-MM-dd
  personalNr?: string;
  address?: string;
  postCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  occupation?: string;
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
