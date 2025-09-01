package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Album;
import org.liberia.norway.org_api.repository.AlbumRepository;
import org.liberia.norway.org_api.repository.PhotoRepository;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
public class AlbumPublicController {

    private final AlbumRepository albumRepo;
    private final PhotoRepository photoRepo;

    @GetMapping
    public Page<AlbumSummary> list(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {

        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return albumRepo.findByIsPublishedTrue(pageable).map(a -> {
            String cover = a.getCoverPhoto() != null ? a.getCoverPhoto().getUrl() : null;
            long count = photoRepo.countByAlbum_Id(a.getId());
            return new AlbumSummary(a.getId(), a.getSlug(), a.getTitle(), a.getDescription(), cover, count);
        });
    }

    @GetMapping("/{slug}")
    public AlbumDetail get(@PathVariable String slug) {
        Album a = albumRepo.findBySlug(slug).filter(Album::isPublished).orElseThrow();
        var photos = photoRepo.findByAlbum_IdAndIsPublishedTrueOrderBySortOrderAsc(a.getId())
                .stream()
                .map(p -> new PhotoItem(p.getId(), p.getUrl(), p.getCaption(), p.getSortOrder()))
                .toList();

        String cover = a.getCoverPhoto() != null ? a.getCoverPhoto().getUrl() : null;

        return new AlbumDetail(
                a.getId(), a.getSlug(), a.getTitle(), a.getDescription(), cover, photos
        );
    }

    public record AlbumSummary(Long id, String slug, String title, String description, String coverUrl, long photoCount) {}
    public record PhotoItem(Long id, String url, String caption, Integer sortOrder) {}
    public record AlbumDetail(Long id, String slug, String title, String description, String coverUrl, List<PhotoItem> photos) {}
}
