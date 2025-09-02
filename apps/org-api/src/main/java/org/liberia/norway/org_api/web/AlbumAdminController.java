package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Album;
import org.liberia.norway.org_api.model.Photo;
import org.liberia.norway.org_api.repository.AlbumRepository;
import org.liberia.norway.org_api.repository.PhotoRepository;
import org.liberia.norway.org_api.service.FileStorageService;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/albums")
@RequiredArgsConstructor
public class AlbumAdminController {

    private final AlbumRepository albumRepo;
    private final PhotoRepository photoRepo;
    private final FileStorageService storage;

    // -------- Albums CRUD --------

    @PostMapping
    @Transactional
    public AlbumResponse create(@RequestBody AlbumUpsertRequest req) {
        var album = new Album();
        album.setTitle(req.title());
        album.setSlug(uniqueSlug(StringUtils.hasText(req.slug()) ? req.slug() : slugify(req.title())));
        album.setDescription(req.description());
        album.setPublished(false);
        album.setCreatedAt(OffsetDateTime.now());
        album.setUpdatedAt(OffsetDateTime.now());
        albumRepo.save(album);
        return mapAlbum(album, 0);
    }

    @PutMapping("/{id}")
    @Transactional
    public AlbumResponse update(@PathVariable Long id, @RequestBody AlbumUpsertRequest req) {
        var album = albumRepo.findById(id).orElseThrow();
        if (StringUtils.hasText(req.title())) album.setTitle(req.title());
        if (req.slug() != null) {
            String next = uniqueSlug(req.slug(), album.getId());
            album.setSlug(next);
        }
        if (req.description() != null) album.setDescription(req.description());
        if (req.isPublished() != null) album.setPublished(req.isPublished());
        album.setUpdatedAt(OffsetDateTime.now());
        long count = photoRepo.countByAlbum_Id(album.getId());
        return mapAlbum(album, count);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        albumRepo.deleteById(id);
    }

    @GetMapping
    public Page<AlbumResponse> list(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var res = albumRepo.findAll(pageable).map(a -> mapAlbum(a, photoRepo.countByAlbum_Id(a.getId())));
        return res;
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<Void> setPublished(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        if (body == null || !body.containsKey("published")) {
            return ResponseEntity.badRequest().build();
        }
        boolean published = Boolean.TRUE.equals(body.get("published"));

        Album album = albumRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found: " + id));

        album.setPublished(published);
        album.setUpdatedAt(OffsetDateTime.now());

        albumRepo.save(album);
        return ResponseEntity.noContent().build();
    }


    @PutMapping("/{id}/cover/{photoId}")
    @Transactional
    public AlbumResponse setCover(@PathVariable Long id, @PathVariable Long photoId) {
        var album = albumRepo.findById(id).orElseThrow();
        var photo = photoRepo.findByIdAndAlbum_Id(photoId, id).orElseThrow();
        album.setCoverPhoto(photo);
        album.setUpdatedAt(OffsetDateTime.now());
        long count = photoRepo.countByAlbum_Id(album.getId());
        return mapAlbum(album, count);
    }

    // -------- Photos (upload & manage) --------

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public List<PhotoResponse> uploadPhotos(@PathVariable Long id,
                                            @RequestPart("files") MultipartFile[] files,
                                            @RequestPart(value = "captions", required = false) List<String> captions) {
        var album = albumRepo.findById(id).orElseThrow();

        int startOrder = photoRepo.maxSortOrder(id) + 1;
        List<PhotoResponse> out = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            var f = files[i];
            var stored = storage.store(f, "photos/" + id);
            var p = new Photo();
            p.setAlbum(album);
            p.setOriginalName(stored.originalName());
            p.setFileName(stored.fileName());
            p.setContentType(stored.contentType());
            p.setSizeBytes(stored.size());
            p.setUrl(stored.url());
            p.setCaption(captions != null && i < captions.size() ? captions.get(i) : null);
            p.setSortOrder(startOrder + i);
            p.setPublished(true);
            p.setCreatedAt(OffsetDateTime.now());
            p.setUpdatedAt(OffsetDateTime.now());
            photoRepo.save(p);
            out.add(mapPhoto(p));
        }
        return out;
    }

    @PutMapping("/photos/{photoId}")
    @Transactional
    public PhotoResponse updatePhoto(@PathVariable Long photoId, @RequestBody PhotoUpdateRequest req) {
        var p = photoRepo.findById(photoId).orElseThrow();
        if (req.caption() != null) p.setCaption(req.caption());
        if (req.isPublished() != null) p.setPublished(req.isPublished());
        if (req.sortOrder() != null) p.setSortOrder(req.sortOrder());
        p.setUpdatedAt(OffsetDateTime.now());
        return mapPhoto(p);
    }

    @DeleteMapping("/photos/{photoId}")
    @Transactional
    public void deletePhoto(@PathVariable Long photoId) {
        photoRepo.deleteById(photoId);
    }

    // -------- DTOs & helpers --------

    public record AlbumUpsertRequest(String title, String slug, String description, Boolean isPublished) {}

    public record AlbumResponse(
            Long id, String slug, String title, String description,
            Boolean isPublished, String coverUrl, Long coverPhotoId,
            Long photoCount, String createdAt, String updatedAt
    ) {}

    public record PhotoResponse(
            Long id, Long albumId, String url, String caption,
            Integer sortOrder, Boolean isPublished, String createdAt, String updatedAt
    ) {}

    public record PhotoUpdateRequest(String caption, Integer sortOrder, Boolean isPublished) {}

    private AlbumResponse mapAlbum(Album a, long photoCount) {
        String coverUrl = a.getCoverPhoto() != null ? a.getCoverPhoto().getUrl() : null;
        Long coverId = a.getCoverPhoto() != null ? a.getCoverPhoto().getId() : null;
        return new AlbumResponse(
                a.getId(), a.getSlug(), a.getTitle(), a.getDescription(),
                a.isPublished(), coverUrl, coverId, photoCount,
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null,
                a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : null
        );
        // OffsetDateTime -> ISO-8601 strings
    }

    private PhotoResponse mapPhoto(Photo p) {
        return new PhotoResponse(
                p.getId(),
                p.getAlbum() != null ? p.getAlbum().getId() : null,
                p.getUrl(),
                p.getCaption(),
                p.getSortOrder(),
                p.isPublished(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null,
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null
        );
    }

    private String uniqueSlug(String base) {
        return uniqueSlug(base, null);
    }

    private String uniqueSlug(String base, Long currentId) {
        String s = slugify(base);
        if (!albumRepo.existsBySlug(s) || (currentId != null && albumRepo.findBySlug(s).map(a -> a.getId().equals(currentId)).orElse(false))) {
            return s;
        }
        // add -2, -3...
        for (int i = 2; i < 10_000; i++) {
            String candidate = s + "-" + i;
            var exists = albumRepo.findBySlug(candidate)
                    .filter(a -> currentId == null || !a.getId().equals(currentId))
                    .isPresent();
            if (!exists) return candidate;
        }
        throw new IllegalStateException("Could not generate unique slug");
    }

    private static String slugify(String input) {
        String s = (input == null ? "" : input).trim().toLowerCase();
        s = s.replaceAll("[^a-z0-9]+", "-");
        s = s.replaceAll("^-+|-+$", "");
        if (s.isEmpty()) s = "album";
        return s;
    }
}
