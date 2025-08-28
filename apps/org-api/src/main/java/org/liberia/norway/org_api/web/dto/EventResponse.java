package org.liberia.norway.org_api.web.dto;

import java.time.OffsetDateTime;
import org.liberia.norway.org_api.model.Event;

import com.fasterxml.jackson.annotation.JsonFormat;

public record EventResponse(
        Long id,
        String slug,
        String title,
        String summary,
        String description,
        String location,
        String coverImageUrl,
        String rsvpUrl,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime startAt,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime endAt,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime createdAt,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime updatedAt,
        Long galleryAlbumId,
        boolean isPublished
) {
    public static EventResponse from(Event e) {
        return new EventResponse(
            e.getId(),
            e.getSlug(),
            e.getTitle(),
            e.getSummary(),
            e.getDescription(),
            e.getLocation(),
            e.getCoverImageUrl(),
            e.getRsvpUrl(),
            e.getStartAt(),
            e.getEndAt(),
            e.getCreatedAt(),
            e.getUpdatedAt(),
            e.getGalleryAlbumId(),
            e.isPublished()      // <<— use boolean getter
        );
    }
}
