package org.liberia.norway.org_api.web;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.liberia.norway.org_api.model.Album;
import org.liberia.norway.org_api.repository.AlbumRepository;
import org.liberia.norway.org_api.web.dto.AlbumItemDto;
import org.liberia.norway.org_api.web.dto.AlbumItemMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
public class AlbumPublicController {

    private final AlbumRepository albumRepo;

    @Value("${app.storage.public-path:/uploads/}")
    private String publicBasePath; // samme default som FileStorageService

    /* -------------------- LISTE (publiserte) -------------------- */
    @GetMapping
    public Page<PublicAlbumListDto> listPublished(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "48") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "created_at"));
        Page<Album> src = albumRepo.findPublished(pageable);

        return src.map(a -> new PublicAlbumListDto(
                a.getId(),
                a.getSlug(),
                safe(a.getTitle()),
                // Hvis du har eventTitle i entiteten – ellers settes null
                tryGetEventTitle(a)
        ));
    }

    /* -------------------- DETALJ (meta + items) -------------------- */
    @GetMapping("/{slug}")
    @Transactional
    public PublicAlbumResponse getOne(@PathVariable String slug) {
        Album album = albumRepo.findPublishedBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Album ikke funnet eller ikke publisert"));

        List<AlbumItemDto> items = album.getItems().stream()
                .sorted(Comparator.comparing(Album.MediaItem::getCreatedAt))
                .map(this::toDtoWithUrlFallback)
                .collect(Collectors.toList());

        AlbumMetaDto meta = new AlbumMetaDto(
                album.getId(),
                album.getSlug(),
                safe(album.getTitle()),
                tryGetEventTitle(album),
                safe(album.getDescription())
        );

        return new PublicAlbumResponse(meta, items);
    }

    /* -------------------- KUN ITEMS (valgfritt) -------------------- */
    @GetMapping("/{slug}/items")
    @Transactional
    public List<AlbumItemDto> listItems(@PathVariable String slug) {
        Album album = albumRepo.findPublishedBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Album ikke funnet eller ikke publisert"));

        return album.getItems().stream()
                .sorted(Comparator.comparing(Album.MediaItem::getCreatedAt))
                .map(this::toDtoWithUrlFallback)
                .collect(Collectors.toList());
    }

    /* -------------------- Hjelpere -------------------- */

    private AlbumItemDto toDtoWithUrlFallback(Album.MediaItem it) {
        AlbumItemDto dto = AlbumItemMapper.toDto(it);
        if ((dto.getUrl() == null || dto.getUrl().isBlank()) && it.getFileName() != null) {
            String base = publicBasePath.endsWith("/")
                    ? publicBasePath.substring(0, publicBasePath.length() - 1)
                    : publicBasePath;
            dto.setUrl(base + "/media2/" + it.getFileName());
        }
        if ((dto.getThumbUrl() == null || dto.getThumbUrl().isBlank()) && it.getFileName() != null) {
            String base = publicBasePath.endsWith("/")
                    ? publicBasePath.substring(0, publicBasePath.length() - 1)
                    : publicBasePath;
            dto.setThumbUrl(base + "/media2/thumbs/" + it.getFileName());
        }
        return dto;
    }

    private static String safe(String s) { return s == null ? "" : s; }

    // Hvis du har et felt getEventTitle() – ellers returner null
    private static String tryGetEventTitle(Album a) {
        try {
            // Reflekter eller kall hvis du har en getter. For enkelhet: cast via interface/utvid dersom du har.
            return (String) Album.class.getMethod("getEventTitle").invoke(a);
        } catch (Exception __) {
            return null;
        }
    }

    /* -------------------- DTO-er for public API -------------------- */

    public record PublicAlbumListDto(Long id, String slug, String title, String eventTitle) { }

    public record AlbumMetaDto(Long id, String slug, String title, String eventTitle, String description) { }

    public record PublicAlbumResponse(AlbumMetaDto album, List<AlbumItemDto> items) { }
}
