// lib/albums.ts
import { apiGet } from "./events";

export type PublicAlbum = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  eventSlug?: string | null;
  eventTitle?: string | null;
};

export type Page<T> = { content: T[]; totalElements?: number; totalPages?: number; size?: number; number?: number };

export async function listPublicAlbums(
  page: number = 0,
  size: number = 48
): Promise<PublicAlbum[] | Page<PublicAlbum>> {
  const data: any = await apiGet(`/api/albums?page=${page}&size=${size}`);

  const raw =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?._embedded?.albums)
      ? data._embedded.albums
      : [];

  // returner Page hvis backenden sendte Page
  if (!Array.isArray(data) && Array.isArray(data?.content)) {
    return { ...data, content: raw.map(normalizeAlbum) };
  }
  return raw.map(normalizeAlbum);
}

function normalizeAlbum(a: any): PublicAlbum {
  const cover =
    a?.coverUrl ?? a?.coverImageUrl ?? a?.coverPhotoUrl ?? a?.imageUrl ?? a?.thumbnailUrl ?? a?.coverPhoto?.url ?? null;

  return {
    id: a?.id ?? a?.albumId,
    slug: a?.slug ?? String(a?.id ?? ""),
    title: a?.title ?? a?.name ?? "Album",
    description: a?.description ?? null,
    coverUrl: cover,
    eventSlug: a?.eventSlug ?? a?.event?.slug ?? null,
    eventTitle: a?.eventTitle ?? a?.event?.title ?? null,
  };
}
