package org.liberia.norway.org_api.web.dto;

import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;

public record EventUpsertRequest(
    @NotBlank String title,
    String slug, 
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
) {}
