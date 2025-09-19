package org.liberia.norway.org_api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lettvekts DTO for et enkelt media-element i et album.
 * Brukes på offentlige endepunkter.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumItemDto {
    private Long id;
    private String title;

    /** Offentlig URL til selve media-ressursen (bilde/video). */
    private String url;

    /** Valgfri thumbnail-url hvis den finnes. */
    private String thumbUrl;

    /** MIME-type hvis kjent (f.eks. image/jpeg, video/mp4). */
    private String contentType;

    /** Størrelse i bytes hvis kjent. */
    private Long sizeBytes;
}
