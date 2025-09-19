package org.liberia.norway.org_api.web.dto;

import java.time.OffsetDateTime;

public record AdvertDto(
        Long id,
        String slug,
        String title,
        String description,
        String targetUrl,
        String placement,
        boolean active,
        String mediaUrl,     // URL til bilde eller video
        String mediaKind,    // "IMAGE" eller "VIDEO"
        Long sizeBytes,
        String contentType,
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

}