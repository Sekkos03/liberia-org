package org.liberia.norway.org_api.web.dto;

import org.liberia.norway.org_api.model.Album;

/**
 * Mapper for album-element (basert på felter som typisk finnes på en Album.MediaItem-modell).
 * Tilpass "gettere" hvis feltnavn i modellen din avviker (f.eks. imageUrl vs url).
 */
public final class AlbumItemMapper {

    private AlbumItemMapper() {
    }

    /**
     * Velg en offentlig URL for elementet ut fra kjente felter i prioritert rekkefølge.
     * Juster rekkefølgen/feltnavn hvis din modell avviker.
     */
    private static String toUrl(Album.MediaItem it) {
        if (it == null) return null;

        // prøv vanlige felter i rekkefølge:
        if (it.getUrl() != null)       return it.getUrl();
        if (it.getImageUrl() != null)  return it.getImageUrl();
        if (it.getVideoUrl() != null)  return it.getVideoUrl();

        // som fallback: bygg en offentlig sti hvis vi kun har filnavn
        if (it.getFileName() != null)  return "/uploads/media2/" + it.getFileName();

        return null;
    }

    public static AlbumItemDto toDto(Album.MediaItem it) {
        if (it == null) return null;

        return AlbumItemDto.builder()
                .id(it.getId())
                .title(it.getTitle())
                .url(toUrl(it))
                .thumbUrl(it.getThumbUrl())
                .contentType(it.getContentType())
                .sizeBytes(it.getSizeBytes())
                .build();
    }
}
