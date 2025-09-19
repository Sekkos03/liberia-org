package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Pages;
import org.liberia.norway.org_api.repository.PageRepository;
import org.springframework.data.domain.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/admin/pages")
@RequiredArgsConstructor
public class PageAdminController {

    private final PageRepository pages;

    @PostMapping
    @Transactional
    public PageResponse create(@RequestBody PageUpsertRequest req) {
        var p = new Pages();
        p.setTitle(req.title());
        p.setSlug(uniqueSlug(StringUtils.hasText(req.slug()) ? req.slug() : slugify(req.title())));
        p.setBody(req.body());
        p.setPublished(Boolean.TRUE.equals(req.published()));
        var now = OffsetDateTime.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        if (p.isPublished()) p.setPublishedAt(now);
        pages.save(p);
        return map(p);
    }

    @PutMapping("/{id}")
    @Transactional
    public PageResponse update(@PathVariable Long id, @RequestBody PageUpsertRequest req) {
        var p = pages.findById(id).orElseThrow();
        if (StringUtils.hasText(req.title())) p.setTitle(req.title());
        if (req.slug() != null) p.setSlug(uniqueSlug(req.slug(), id));
        if (req.body() != null) p.setBody(req.body());
        if (req.published() != null) {
            p.setPublished(req.published());
            p.setPublishedAt(req.published() ? OffsetDateTime.now() : null);
        }
        p.setUpdatedAt(OffsetDateTime.now());
        return map(p);
    }

    @PostMapping("/{id}/publish")
    @Transactional
    public PageResponse setPublished(@PathVariable Long id, @RequestParam boolean value) {
        var p = pages.findById(id).orElseThrow();
        p.setPublished(value);
        p.setPublishedAt(value ? OffsetDateTime.now() : null);
        p.setUpdatedAt(OffsetDateTime.now());
        return map(p);
    }

    @GetMapping
    public org.springframework.data.domain.Page<PageResponse> list(@RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return pages.findAll(pageable).map(this::map);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        pages.deleteById(id);
    }

    // DTOs
    public record PageUpsertRequest(String title, String slug, String body, Boolean published) {}
    public record PageResponse(Long id, String slug, String title, String body, Boolean published,
                               String publishedAt, String createdAt, String updatedAt) {}

    private PageResponse map(Pages p) {
        return new PageResponse(
                p.getId(), p.getSlug(), p.getTitle(), p.getBody(), p.isPublished(),
                p.getPublishedAt() != null ? p.getPublishedAt().toString() : null,
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null,
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null
        );
    }

    // Helpers
    private String uniqueSlug(String base) { return uniqueSlug(base, null); }

    private String uniqueSlug(String base, Long currentId) {
        String s = slugify(base);
        var taken = pages.findBySlug(s)
                .filter(pg -> currentId == null || !pg.getId().equals(currentId))
                .isPresent();
        if (!taken) return s;
        for (int i = 2; i < 10_000; i++) {
            String cand = s + "-" + i;
            var exists = pages.findBySlug(cand)
                    .filter(pg -> currentId == null || !pg.getId().equals(currentId))
                    .isPresent();
            if (!exists) return cand;
        }
        throw new IllegalStateException("Could not generate unique slug for page");
    }

    private static String slugify(String input) {
        String s = (input == null ? "" : input).trim().toLowerCase();
        s = s.replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return s.isEmpty() ? "page" : s;
    }
}
