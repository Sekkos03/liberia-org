package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Pages;
import org.liberia.norway.org_api.repository.PageRepository;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class PagePublicController {

    private final PageRepository pages;

    @GetMapping
    public org.springframework.data.domain.Page<PageSummary> list(@RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return pages.findByPublishedTrue(pageable)
                .map(p -> new PageSummary(p.getId(), p.getSlug(), p.getTitle()));
    }

    @GetMapping("/{slug}")
    public PageDetail get(@PathVariable String slug) {
        Pages p = pages.findBySlug(slug).filter(Pages::isPublished).orElseThrow();
        return new PageDetail(p.getId(), p.getSlug(), p.getTitle(), p.getBody(), p.getPublishedAt() != null ? p.getPublishedAt().toString() : null);
    }

    public record PageSummary(Long id, String slug, String title) {}
    public record PageDetail(Long id, String slug, String title, String body, String publishedAt) {}
}

