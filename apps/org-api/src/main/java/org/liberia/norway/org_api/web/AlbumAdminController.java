package org.liberia.norway.org_api.web;

import java.net.URI;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/albums")
@RequiredArgsConstructor
@Slf4j
public class AlbumAdminController {

    @Value("${app.storage.public-path:/uploads}")
    private String publicBasePath;

    // Supported file types
    private static final Set<String> SUPPORTED_IMAGE_TYPES = new HashSet<>(Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"
    ));
    
    private static final Set<String> SUPPORTED_VIDEO_TYPES = new HashSet<>(Arrays.asList(
        "video/mp4", "video/webm", "video/ogg", "video/quicktime", // .mov
        "video/x-msvideo", // .avi
        "video/x-matroska", // .mkv
        "video/3gpp", "video/3gpp2"
    ));
    
    // File extensions for fallback detection
    private static final Set<String> VIDEO_EXTENSIONS = new HashSet<>(Arrays.asList(
        "mp4", "webm", "ogg", "mov", "avi", "mkv", "3gp", "3g2"
    ));
    
    private static final Set<String> IMAGE_EXTENSIONS = new HashSet<>(Arrays.asList(
        "jpg", "jpeg", "png", "gif", "webp", "heic", "heif"
    ));

    private String publicBase() {
        String base = (publicBasePath == null || publicBasePath.isBlank()) ? "/uploads" : publicBasePath;
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private final AlbumRepository albumRepo;
    private final FileStorageService fileStorageService;

    // ---------- DTOs ----------
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

    // Error response DTO
    public record ErrorResponse(
            int status,
            String message,
            String detail
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AlbumCreateRequest {
        @NotBlank public String title;
        public String description;
        public String slug;
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

    // ---------- Exception Handlers ----------
    
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        log.error("File upload size exceeded: {}", exc.getMessage());
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponse(
                        413,
                        "File too large",
                        "The uploaded file exceeds the maximum allowed size. " +
                        "Maximum file size is 500MB for videos and 50MB for images."
                ));
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

    // ---------- Update (ADMIN) ----------
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

    // --- hent alle items i album (admin) ---
    @GetMapping("/{id}/items")
    @Transactional
    public List<AlbumItemDto> getItems(@PathVariable Long id) {
        Album album = albumRepo.findById(id).orElseThrow();

        return album.getItems().stream()
                .sorted(Comparator.comparing(Album.MediaItem::getCreatedAt))
                .map(it -> {
                    AlbumItemDto dto = AlbumItemMapper.toDto(it);
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
    public void deleteItem(@PathVariable("albumId") Long albumId, @PathVariable("itemId") Long itemId) {
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

    // ---------- Delete (ADMIN) ----------
    @DeleteMapping("/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Album album = albumRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));
        
        if (album.getItems() != null && !album.getItems().isEmpty()) {
            for (Album.MediaItem item : album.getItems()) {
                if (item.getFileName() != null) {
                    try {
                        fileStorageService.delete(item.getFileName(), "media2");
                    } catch (Exception e) {
                        log.warn("Failed to delete file: {}", item.getFileName(), e);
                    }
                }
            }
        }
        
        albumRepo.delete(album);
    }

    // --- Upload files to album (admin) - IMPROVED FOR VIDEO SUPPORT ---
    @PostMapping(path = "/{id}/items", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> uploadItems(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files
    ) {
        log.info("Upload request received for album {}: {} files", id, files.size());

        Album album = albumRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));

        List<Album.MediaItem> saved = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (MultipartFile mf : files) {
            if (mf == null || mf.isEmpty()) {
                log.debug("Skipping empty file");
                continue;
            }

            String originalFilename = mf.getOriginalFilename();
            String contentType = mf.getContentType();
            long fileSize = mf.getSize();

            log.info("Processing file: name={}, contentType={}, size={}MB", 
                    originalFilename, contentType, fileSize / (1024.0 * 1024.0));

            // Validate file type
            if (!isValidFileType(contentType, originalFilename)) {
                String errorMsg = String.format("Unsupported file type: %s (%s)", 
                        originalFilename, contentType);
                log.warn(errorMsg);
                errors.add(errorMsg);
                continue;
            }

            try {
                // Store the file
                var stored = fileStorageService.store(mf, "media2");

                // Determine if it's a video based on content type AND extension
                boolean isVideo = isVideoFile(contentType, originalFilename);

                Album.MediaItem item = new Album.MediaItem();
                item.setAlbum(album);
                item.setFileName(stored.fileName());
                item.setMediaType(isVideo ? Album.MediaType.VIDEO : Album.MediaType.IMAGE);
                item.setCreatedAt(Instant.now());
                item.setUrl(stored.url());
                item.setContentType(contentType);
                item.setSizeBytes(fileSize);

                album.getItems().add(item);
                saved.add(item);

                log.info("Successfully stored file: {} as {}", originalFilename, 
                        isVideo ? "VIDEO" : "IMAGE");

            } catch (Exception e) {
                String errorMsg = String.format("Failed to upload %s: %s", 
                        originalFilename, e.getMessage());
                log.error(errorMsg, e);
                errors.add(errorMsg);
            }
        }

        albumRepo.saveAndFlush(album);

        List<AlbumItemDto> result = saved.stream()
                .map(AlbumItemMapper::toDto)
                .collect(Collectors.toList());

        // If there were errors but some files succeeded, include a warning
        if (!errors.isEmpty()) {
            if (saved.isEmpty()) {
                // All files failed
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(
                                400,
                                "Upload failed",
                                String.join("; ", errors)
                        ));
            } else {
                // Partial success - return the results with a warning header
                log.warn("Partial upload success. Errors: {}", errors);
                return ResponseEntity
                        .ok()
                        .header("X-Upload-Warnings", String.join("; ", errors))
                        .body(result);
            }
        }

        return ResponseEntity.ok(result);
    }

    // ---------- Helpers ----------

    /**
     * Check if the file type is supported (image or video)
     */
    private boolean isValidFileType(String contentType, String filename) {
        // Check by content type
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (SUPPORTED_IMAGE_TYPES.contains(ct) || SUPPORTED_VIDEO_TYPES.contains(ct)) {
                return true;
            }
        }
        
        // Fallback: check by extension
        if (filename != null) {
            String ext = getFileExtension(filename).toLowerCase();
            return IMAGE_EXTENSIONS.contains(ext) || VIDEO_EXTENSIONS.contains(ext);
        }
        
        return false;
    }

    /**
     * Determine if a file is a video based on content type and extension
     */
    private boolean isVideoFile(String contentType, String filename) {
        // Check by content type first
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.startsWith("video/") || SUPPORTED_VIDEO_TYPES.contains(ct)) {
                return true;
            }
        }
        
        // Fallback: check by extension
        if (filename != null) {
            String ext = getFileExtension(filename).toLowerCase();
            return VIDEO_EXTENSIONS.contains(ext);
        }
        
        return false;
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1 || lastDot == filename.length() - 1) return "";
        return filename.substring(lastDot + 1);
    }

    private String ensureUniqueSlug(String base) {
        String candidate = base;
        int i = 2;

        while (albumRepo.existsBySlug(candidate)) {
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