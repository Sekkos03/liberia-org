package org.liberia.norway.org_api.web.dto;

import org.springframework.stereotype.Component;
import org.liberia.norway.org_api.model.Event;

@Component
public class EventMapper {

  public EventDto toDto(Event e) {
    if (e == null) return null;

    EventDto dto = new EventDto();
    dto.id = e.getId();
    dto.slug = e.getSlug();
    dto.title = e.getTitle();
    dto.summary = e.getSummary();
    dto.description = e.getDescription();
    dto.location = e.getLocation();

    // 🔑 Denne må med for at bilder skal vises i frontend
    dto.coverImageUrl = e.getCoverImageUrl();

    dto.rsvpUrl = e.getRsvpUrl();
    dto.startAt = e.getStartAt();
    dto.endAt = e.getEndAt();
    dto.galleryAlbumId = e.getGalleryAlbumId();
    dto.isPublished = e.isPublished();

    dto.createdAt = e.getCreatedAt();
    dto.updatedAt = e.getUpdatedAt();
    return dto;
  }

  public void apply(EventDto dto, Event e) {
    if (dto == null || e == null) return;

    e.setSlug(dto.slug);
    e.setTitle(dto.title);
    e.setSummary(dto.summary);
    e.setDescription(dto.description);
    e.setLocation(dto.location);

    // valgfritt: hvis du IKKE vil at JSON skal kunne sette cover, fjern linja under
    e.setCoverImageUrl(dto.coverImageUrl);

    e.setRsvpUrl(dto.rsvpUrl);
    e.setStartAt(dto.startAt);
    e.setEndAt(dto.endAt);
    e.setGalleryAlbumId(dto.galleryAlbumId);

    if (dto.isPublished != null) e.setPublished(dto.isPublished);
  }
}