package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.model.Advert.Placement;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.liberia.norway.org_api.service.FileStorageService;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/adverts")
@RequiredArgsConstructor
public class AdvertAdminController {

    private final AdvertRepository adverts;
    private final FileStorageService storage;

    @PostMapping
    @Transactional
    public AdvertResponse create(@RequestBody AdvertUpsertRequest req) {
        var a = new Advert();
        a.setTitle(req.title());
        a.setSlug(uniqueSlug(StringUtils.hasText(req.slug()) ? req.slug() : slugify(req.title())));
        a.setDescription(req.description());
        a.setTargetUrl(req.targetUrl());
        a.setPlacement(req.placement() == null ? Placement.SIDEBAR : req.placement());
        a.setActive(Boolean.TRUE.equals(req.active()));
        a.setStartAt(req.startAt());
        a.setEndAt(req.endAt());
        var now = OffsetDateTime.now();
        a.setCreatedAt(now);
        a.setUpdatedAt(now);
        adverts.save(a);
        return map(a);
    }

    @PutMapping("/{id}")
    @Transactional
    public AdvertResponse update(@PathVariable Long id, @RequestBody AdvertUpsertRequest req) {
        var a = adverts.findById(id).orElseThrow();
        if (StringUtils.hasText(req.title())) a.setTitle(req.title());
        if (req.slug() != null) a.setSlug(uniqueSlug(req.slug(), id));
        if (req.description() != null) a.setDescription(req.description());
        if (req.targetUrl() != null) a.setTargetUrl(req.targetUrl());
        if (req.placement() != null) a.setPlacement(req.placement());
        if (req.active() != null) a.setActive(req.active());
        if (req.startAt() != null) a.setStartAt(req.startAt());
        if (req.endAt() != null) a.setEndAt(req.endAt());
        a.setUpdatedAt(OffsetDateTime.now());
        return map(a);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public AdvertResponse uploadImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        var a = adverts.findById(id).orElseThrow();
        var stored = storage.store(file, "adverts");
        a.setOriginalName(stored.originalName());
        a.setFileName(stored.fileName());
        a.setContentType(stored.contentType());
        a.setSizeBytes(stored.size());
        a.setImageUrl(stored.url());
        a.setUpdatedAt(OffsetDateTime.now());
        return map(a);
    }

    @PostMapping("/{id}/active")
    @Transactional
    public AdvertResponse setActive(@PathVariable Long id, @RequestParam boolean value) {
        var a = adverts.findById(id).orElseThrow();
        a.setActive(value);
        a.setUpdatedAt(OffsetDateTime.now());
        return map(a);
    }

    @GetMapping
    public org.springframework.data.domain.Page<AdvertResponse> list(@RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return adverts.findAll(pageable).map(this::map);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        adverts.deleteById(id);
    }

    // DTOs
    public record AdvertUpsertRequest(
            String title,
            String slug,
            String description,
            String targetUrl,
            Placement placement,
            Boolean active,
            OffsetDateTime startAt,
            OffsetDateTime endAt
    ) {}

    public record AdvertResponse(
            Long id, String slug, String title, String description,
            String targetUrl, Placement placement, Boolean active,
            String imageUrl, String createdAt, String updatedAt,
            String startAt, String endAt
    ) {}

    private AdvertResponse map(Advert a) {
        return new AdvertResponse(
                a.getId(), a.getSlug(), a.getTitle(), a.getDescription(),
                a.getTargetUrl(), a.getPlacement(), a.isActive(),
                a.getImageUrl(),
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null,
                a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : null,
                a.getStartAt() != null ? a.getStartAt().toString() : null,
                a.getEndAt() != null ? a.getEndAt().toString() : null
        );
    }

    // Helpers
    private String uniqueSlug(String base) { return uniqueSlug(base, null); }

    private String uniqueSlug(String base, Long currentId) {
        String s = slugify(base);
        var taken = adverts.findBySlug(s)
                .filter(a -> currentId == null || !a.getId().equals(currentId))
                .isPresent();
        if (!taken) return s;
        for (int i = 2; i < 10_000; i++) {
            String cand = s + "-" + i;
            var exists = adverts.findBySlug(cand)
                    .filter(a -> currentId == null || !a.getId().equals(currentId))
                    .isPresent();
            if (!exists) return cand;
        }
        throw new IllegalStateException("Could not generate unique slug for advert");
    }

    private static String slugify(String input) {
        String s = (input == null ? "" : input).trim().toLowerCase();
        s = s.replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return s.isEmpty() ? "advert" : s;
    }
}
