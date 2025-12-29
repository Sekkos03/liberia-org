package org.liberia.norway.org_api.web;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import org.liberia.norway.org_api.model.Album;
import org.liberia.norway.org_api.model.Event;
import org.liberia.norway.org_api.repository.AlbumRepository;
import org.liberia.norway.org_api.repository.EventRepository;
import org.liberia.norway.org_api.service.FileStorageService;
import org.liberia.norway.org_api.web.dto.EventDto;
import org.liberia.norway.org_api.web.dto.EventMapper;
import org.liberia.norway.org_api.web.dto.EventResponse;
import org.liberia.norway.org_api.web.dto.EventUpsertRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/events")
public class EventAdminController {

    private final EventRepository eventRepo;
    private final AlbumRepository albumRepo;
    private final FileStorageService storage;
    private final EventMapper mapper;

    public EventAdminController(EventRepository eventRepo, AlbumRepository albumRepo, FileStorageService storage, EventMapper mapper) {
        this.eventRepo = eventRepo;
        this.albumRepo = albumRepo;
        this.storage = storage;
        this.mapper = mapper;
    }

    @Value("${app.storage.public-path:/uploads}")
    private String publicBasePath;

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Map<String, String> upload(@RequestPart("file") MultipartFile file,
                                  @RequestPart(value = "folder", required = false) String folder) throws IOException {

    // folder fra frontend: "events/covers"
    String safeFolder = (folder == null || folder.isBlank()) ? "media3" : folder;
    safeFolder = safeFolder.replace("\\", "/").replace("..", "").replaceAll("^/+", "").replaceAll("/+$", "");

    String ext = "jpg";
    String original = file.getOriginalFilename();
    if (original != null && original.contains(".")) {
        ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
    }

    String stored = UUID.randomUUID() + "." + ext;

    java.nio.file.Path dir = Paths.get("uploads").resolve(safeFolder);
    Files.createDirectories(dir);

    java.nio.file.Path target = dir.resolve(stored);
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

    String url = "/uploads/" + safeFolder + "/" + stored;
    return Map.of("url", url);
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
    @Transactional
    public EventResponse update(@PathVariable Long id, @RequestBody EventUpsertRequest body) {
        Event ev = eventRepo.findById(id).orElseThrow();

        // sett enkle felter (tilpass til dine felt/navn)
        ev.setTitle(body.title());
        ev.setSummary(body.summary());
        ev.setDescription(body.description());
        ev.setStartAt(body.startAt());
        ev.setEndAt(body.endAt());
        ev.setLocation(body.location());
        ev.setCoverImageUrl(body.coverImageUrl()); // evt. emptyToNull(...)
        ev.setRsvpUrl(body.rsvpUrl());
        ev.setSlug(body.slug());
        ev.setPublished(Boolean.TRUE.equals(body.isPublished()));
        ev.setUpdatedAt(OffsetDateTime.now());

        // --- Viktig: håndter album-kobling riktig ---
        Long albumId = body.galleryAlbumId();
        if (albumId == null || albumId == 0L) {
            // Ingen album valgt -> lagre som NULL i DB
            ev.setGalleryAlbumId(null);
        } else {
            Album album = albumRepo.findById(albumId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Album not found: " + albumId));
            ev.setGalleryAlbumId(album.getId());
        }

        ev = eventRepo.save(ev);
        return EventResponse.from(ev);
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

    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EventDto uploadCover(@PathVariable Long id, @RequestPart("file") MultipartFile file) throws IOException {
    Event event = eventRepo.findById(id).orElseThrow();

    // finn filendelse
    String ext = "jpg";
    String original = file.getOriginalFilename();
    if (original != null && original.contains(".")) {
        ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
    }

    String stored = java.util.UUID.randomUUID() + "." + ext;

    java.nio.file.Path dir = java.nio.file.Paths.get("uploads", "media3");
    java.nio.file.Files.createDirectories(dir);

    java.nio.file.Path target = dir.resolve(stored);
    java.nio.file.Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

    // sett URL som frontend kan bruke
    event.setCoverImageUrl("/uploads/media3/" + stored);

    eventRepo.save(event);
    return mapper.toDto(event);
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