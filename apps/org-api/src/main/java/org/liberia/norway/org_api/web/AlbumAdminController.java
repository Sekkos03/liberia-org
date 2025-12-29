package org.liberia.norway.org_api.web;

import java.net.URI;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.liberia.norway.org_api.model.Album;
import org.liberia.norway.org_api.repository.AlbumRepository;
import org.liberia.norway.org_api.service.FileStorageService;
import org.liberia.norway.org_api.web.dto.AlbumItemDto;
import org.liberia.norway.org_api.web.dto.AlbumItemMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/albums")
@RequiredArgsConstructor
public class AlbumAdminController {
    @Value("${app.storage.public-path:/uploads}")
private String publicBasePath;

// Trim trailing "/" og gi fornuftig default
private String publicBase() {
    String base = (publicBasePath == null || publicBasePath.isBlank()) ? "/uploads" : publicBasePath;
    return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
}

    private final AlbumRepository albumRepo;
    private final FileStorageService fileStorageService;

    // ---------- DTOer ----------
    public record AdminAlbumDto(
            Long id,
            String slug,
            String title,
            String description,
            boolean published,
            Instant createdAt,
            Instant updatedAt,
            Integer itemsCount
    ) {
        public static AdminAlbumDto from(Album a) {
            return new AdminAlbumDto(
                    a.getId(),
                    a.getSlug(),
                    a.getTitle(),
                    a.getDescription(),
                    a.isPublished(),
                    a.getCreatedAt(),
                    a.getUpdatedAt(),
                    a.getItems() != null ? a.getItems().size() : 0
            );
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AlbumCreateRequest {
        @NotBlank public String title;
        public String description;
        public String slug; // valgfri – genereres fra title hvis tom
        @JsonAlias({"isPublished","published"})
        public Boolean published;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AlbumUpdateRequest {
        public String title;
        public String description;
        public String slug;
        @JsonAlias({"isPublished","published"})
        public Boolean published;
        public Long coverPhotoId;
    }

    // ---------- Hent alle (ADMIN) ----------
    @GetMapping
    public Page<AdminAlbumDto> listAdmin(@PageableDefault(size = 48) Pageable pageable) {
        return albumRepo.findAll(pageable).map(AdminAlbumDto::from);
    }
    
     // ---------- Hent ett album (ADMIN) ----------
    @GetMapping("/{id}")
    @Transactional
    public AdminAlbumDto getOne(@PathVariable Long id) {
        var album = albumRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));
        return AdminAlbumDto.from(album);
    }

    // ---------- Create (ADMIN) ----------
    @PostMapping
    @Transactional
    public ResponseEntity<AdminAlbumDto> create(@RequestBody AlbumCreateRequest req,
                                                UriComponentsBuilder ucb) {
        if (req.title == null || req.title.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String baseSlug = (req.slug != null && !req.slug.isBlank())
                ? slugify(req.slug)
                : slugify(req.title);
        String uniqueSlug = ensureUniqueSlug(baseSlug);

        Album a = new Album();
        a.setTitle(req.title.trim());
        a.setDescription(req.description);
        a.setPublished(Boolean.TRUE.equals(req.published));
        a.setSlug(uniqueSlug);

        a = albumRepo.save(a);

        URI location = ucb.path("/api/admin/albums/{id}").buildAndExpand(a.getId()).toUri();
        return ResponseEntity.created(location).body(AdminAlbumDto.from(a));
    }

    // ---------- Update (ADMIN) – hvis du allerede har denne, la den stå ----------
    @PutMapping("/{id}")
    @Transactional
    public AdminAlbumDto update(@PathVariable Long id, @RequestBody AlbumUpdateRequest req) {
        Album a = albumRepo.findById(id).orElseThrow();

        if (req.title != null) a.setTitle(req.title.trim());
        if (req.description != null) a.setDescription(req.description);
        if (req.published != null) a.setPublished(req.published);

        if (req.slug != null && !req.slug.isBlank()) {
            String wanted = slugify(req.slug);
            if (!wanted.equals(a.getSlug())) {
                a.setSlug(ensureUniqueSlug(wanted));
            }
        }

        a = albumRepo.save(a);
        return AdminAlbumDto.from(a);
    }
    // --- ADD: hent alle items i album (admin) ---
@GetMapping("/{id}/items")
@Transactional
public List<AlbumItemDto> getItems(@PathVariable Long id) {
    Album album = albumRepo.findById(id).orElseThrow();

    return album.getItems().stream()
            .sorted(Comparator.comparing(Album.MediaItem::getCreatedAt))
            .map(it -> {
                AlbumItemDto dto = AlbumItemMapper.toDto(it);
                // fallback URL hvis kun filnavn er lagret
                if ((dto.getUrl() == null || dto.getUrl().isBlank()) && it.getFileName() != null) {
                    String base = publicBase();
                    dto.setUrl(base + "/media2/" + it.getFileName());

                }
                return dto;
            })
            .collect(Collectors.toList());
}

@DeleteMapping("/{albumId}/items/{itemId}")
@Transactional
@ResponseStatus(HttpStatus.NO_CONTENT)
public void deleteItem(
        @PathVariable("albumId") Long albumId,
        @PathVariable("itemId") Long itemId
) {
    Album album = albumRepo.findById(albumId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));

    Album.MediaItem item = album.getItems().stream()
            .filter(it -> it.getId() != null && it.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

    album.getItems().remove(item);
    item.setAlbum(null);

    albumRepo.save(album);
}



// --- ADD: last opp filer til album (admin) ---
@PostMapping(path = "/{id}/items", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
@Transactional
public List<AlbumItemDto> uploadItems(
        @PathVariable Long id,
        @RequestPart("files") List<org.springframework.web.multipart.MultipartFile> files
) {

    Album album = albumRepo.findById(id).orElseThrow();
    List<Album.MediaItem> saved = new java.util.ArrayList<>();

    for (org.springframework.web.multipart.MultipartFile mf : files) {
        if (mf == null || mf.isEmpty()) continue;

        var stored = fileStorageService.store(mf, "media2"); // <-- skriver til app.storage.root/media2

        String ct = (stored.contentType() == null) ? "" : stored.contentType().toLowerCase();
        boolean isVideo = ct.startsWith("video/")
                || stored.fileName().toLowerCase().endsWith(".mp4")
                || stored.fileName().toLowerCase().endsWith(".mov")
                || stored.fileName().toLowerCase().endsWith(".mkv")
                || stored.fileName().toLowerCase().endsWith(".webm")
                || stored.fileName().toLowerCase().endsWith(".avi");

        Album.MediaItem item = new Album.MediaItem();
        item.setAlbum(album);
        item.setFileName(stored.fileName());
        item.setMediaType(isVideo ? Album.MediaType.VIDEO : Album.MediaType.IMAGE);
        item.setCreatedAt(java.time.Instant.now());
        item.setUrl(stored.url()); // <-- offentlig URL (/uploads/media2/...)

        album.getItems().add(item);
        saved.add(item);
    }

    albumRepo.saveAndFlush(album);
    return saved.stream().map(AlbumItemMapper::toDto).collect(Collectors.toList());
}




    // ---------- Hjelpere ----------
    private String ensureUniqueSlug(String base) {
        String candidate = base;
        int i = 2;
        while (albumRepo.findBySlug(candidate)) {
            candidate = base + "-" + i++;
        }
        return candidate;
    }

    private static String slugify(String in) {
        String s = Normalizer.normalize(in, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        s = s.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return s.isBlank() ? "album" : s;
    }
}
