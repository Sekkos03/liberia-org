package org.liberia.norway.org_api.web;

import org.liberia.norway.org_api.model.Event;
import org.liberia.norway.org_api.repository.EventRepository;
import org.liberia.norway.org_api.util.SlugUtil;
import org.liberia.norway.org_api.web.dto.EventResponse;
import org.liberia.norway.org_api.web.dto.EventUpsertRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import jakarta.validation.Valid;

@Tag(name = "Admin Events")
@SecurityRequirement(name = "basicAuth")
@RestController
@RequestMapping("/api/**")
@CrossOrigin(origins = {"http://localhost:8080"})
public class EventAdminController {
  private final EventRepository repo;

  public EventAdminController(EventRepository repo) { this.repo = repo; }

  @GetMapping
  public Page<EventResponse> list(@RequestParam(defaultValue="0") int page,
                                  @RequestParam(defaultValue="20") int size) {
    var p = repo.findAll(PageRequest.of(page, size));
    return p.map(EventResponse::from);
  }
@Operation(summary = "Create a new event")
  @PostMapping("/admin/events")
  public ResponseEntity<EventResponse> create(@Valid @RequestBody EventUpsertRequest body) {
    var slug = SlugUtil.slugify(body.title());
    if (slug == null) return ResponseEntity.badRequest().build();
    if (repo.existsBySlug(slug)) return ResponseEntity.status(409).build();

    var e = new Event();
    e.setSlug(slug);
    e.setTitle(body.title());
    e.setSummary(body.summary());
    e.setDescription(body.description());
    e.setLocation(body.location());
    e.setCoverImageUrl(body.coverImageUrl());
    e.setRsvpUrl(body.rsvpUrl());
    e.setStartAt(body.startAt());
    e.setEndAt(body.endAt());
    e.setCreatedAt(body.createdAt());
    e.setUpdatedAt(body.updatedAt());
    e.setGalleryAlbumId(body.galleryAlbumId());
    e.setPublished(body.isPublished());

    var saved = repo.save(e);
    return ResponseEntity.ok(EventResponse.from(saved));
  }


  @PutMapping("/admin/events/{id}")
  @Transactional
  public ResponseEntity<EventResponse> update(@PathVariable Long id,
                                          @Valid @RequestBody EventUpsertRequest body) {
    return (ResponseEntity<EventResponse>) repo.findById(id).map(e -> {
      var newSlug = SlugUtil.slugify(body.title());
      if (newSlug == null) return ResponseEntity.badRequest().build();
      if (!newSlug.equals(e.getSlug()) && repo.existsBySlug(newSlug)) {
        return ResponseEntity.status(409).build();
      }
      e.setSlug(newSlug);
      e.setTitle(body.title());
      e.setSummary(body.summary());
      e.setDescription(body.description());
      e.setLocation(body.location());
      e.setCoverImageUrl(body.coverImageUrl());
      e.setRsvpUrl(body.rsvpUrl());
      e.setStartAt(body.startAt());
      e.setEndAt(body.endAt());
      e.setCreatedAt(body.createdAt());
      e.setUpdatedAt(body.updatedAt());
      e.setGalleryAlbumId(body.galleryAlbumId());
      e.setPublished(body.isPublished());
      return ResponseEntity.ok(EventResponse.from(e));
    }).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PatchMapping("/admin/events/{id}/publish")
  @Transactional
  public ResponseEntity<Object> setIsPublished(@PathVariable Long id, @RequestParam boolean value) {
    return repo.findById(id).map(e -> {
      e.setPublished(value);
      return ResponseEntity.noContent().build();
    }).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/admin/events/{id}")
  @Transactional
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    if (!repo.existsById(id)) return ResponseEntity.notFound().build();
    repo.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
