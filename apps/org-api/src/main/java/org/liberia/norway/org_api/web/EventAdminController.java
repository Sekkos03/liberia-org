package org.liberia.norway.org_api.web;

import org.liberia.norway.org_api.model.Event;
import org.liberia.norway.org_api.repository.EventRepository;
import org.liberia.norway.org_api.web.dto.EventResponse;
import org.liberia.norway.org_api.web.dto.EventUpsertRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/events")
public class EventAdminController {

    private final EventRepository eventRepo;

    public EventAdminController(EventRepository eventRepo) {
        this.eventRepo = eventRepo;
    }

    @GetMapping
    public Page<EventResponse> list(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return eventRepo.findAll(PageRequest.of(page, size)).map(EventResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@RequestBody EventUpsertRequest req) {
        var e = new Event();
        apply(e, req);
        e.setCreatedAt(OffsetDateTime.now());
        e.setUpdatedAt(OffsetDateTime.now());
        e = eventRepo.save(e);
        return EventResponse.from(e);
    }

    @PutMapping("/{id}")
    public EventResponse update(@PathVariable long id, @RequestBody EventUpsertRequest req) {
        var e = eventRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        apply(e, req);
        e.setUpdatedAt(OffsetDateTime.now());
        e = eventRepo.save(e);
        return EventResponse.from(e);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        if (!eventRepo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        eventRepo.deleteById(id);
    }

    // ✅ NEW/PATCH publish toggle
    @PatchMapping("/{id}/publish")
    public EventResponse setPublished(@PathVariable long id,
                                      @RequestParam(value = "value", required = false) Boolean value,
                                      @RequestBody(required = false) Map<String, Object> body) {
        if (value == null && body != null) {
            if (body.containsKey("value")) {
                value = Boolean.valueOf(String.valueOf(body.get("value")));
            } else if (body.containsKey("published")) {
                value = Boolean.valueOf(String.valueOf(body.get("published")));
            }
        }
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Provide 'value' query param or JSON body { value: boolean }");
        }

        var e = eventRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        e.setPublished(value);
        e.setUpdatedAt(OffsetDateTime.now());
        e = eventRepo.save(e);
        return EventResponse.from(e);
    }

    private static void apply(Event e, EventUpsertRequest req) {
        e.setSlug(req.slug());
        e.setTitle(req.title());
        e.setSummary(emptyToNull(req.summary()));
        e.setDescription(emptyToNull(req.description()));
        e.setLocation(emptyToNull(req.location()));
        e.setCoverImageUrl(emptyToNull(req.coverImageUrl()));
        e.setRsvpUrl(emptyToNull(req.rsvpUrl()));
        e.setStartAt(req.startAt());
        e.setEndAt(req.endAt());
        e.setGalleryAlbumId(req.galleryAlbumId());
        // published is not set here; controlled via PATCH
    }

    private static String emptyToNull(String v) { return (v == null || v.isBlank()) ? null : v; }
}
