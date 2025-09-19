package org.liberia.norway.org_api.web.dto;

import org.liberia.norway.org_api.model.Advert;

public final class AdvertMapper {

    private AdvertMapper() {}

    public static AdvertDto toDto(Advert a) {
        String mediaUrl = a.getImageUrl();
        // Om fil er opplastet, pek mot opplastet fil under /uploads/adverts/<fileName>
        if (a.getFileName() != null && !a.getFileName().isBlank()) {
            mediaUrl = "/uploads/adverts/" + a.getFileName();
        }

        String kind = "IMAGE";
        String ct = a.getContentType();
        if (ct != null && ct.toLowerCase().startsWith("video/")) {
            kind = "VIDEO";
        }

        return new AdvertDto(
                a.getId(),
                a.getSlug(),
                a.getTitle(),
                a.getDescription(),
                a.getTargetUrl(),
                a.getPlacement().name(),
                a.isActive(),
                mediaUrl,
                kind,
                a.getSizeBytes(),
                a.getContentType(),
                a.getStartAt(),
                a.getEndAt(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
