package org.liberia.norway.org_api.web.dto;

import java.util.Comparator;

import org.liberia.norway.org_api.model.Album;

public final class AlbumMapper {
    private AlbumMapper() {}

    public static AlbumDto toDto(Album album, String publicBasePath) {
        String coverUrl = null;

        if (album.getItems() != null && !album.getItems().isEmpty()) {
            // Ta nyeste element som cover
            Album.MediaItem item = album.getItems().stream()
                    .max(Comparator.comparing(Album.MediaItem::getCreatedAt))
                    .orElse(null);

            if (item != null) {
                AlbumItemDto itemDto = AlbumItemMapper.toDto(item);
                coverUrl = itemDto.getUrl();

                // Fallback: bygg URL fra filnavn hvis image-url mangler
                if ((coverUrl == null || coverUrl.isBlank()) && item.getFileName() != null) {
                    String base = publicBasePath.endsWith("/")
                            ? publicBasePath.substring(0, publicBasePath.length() - 1)
                            : publicBasePath;
                    coverUrl = base + "/media2/" + item.getFileName();
                }
            }
        }

        return AlbumDto.builder()
                .id(album.getId())
                .title(album.getTitle())
                .slug(album.getSlug())
                .coverUrl(coverUrl)
                .itemsCount(album.getItems() == null ? 0 : album.getItems().size())
                .build();
    }
}
