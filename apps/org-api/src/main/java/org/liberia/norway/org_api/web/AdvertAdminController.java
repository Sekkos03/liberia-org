package org.liberia.norway.org_api.web;

import java.time.OffsetDateTime;

import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.liberia.norway.org_api.service.FileStorageService;
import org.liberia.norway.org_api.web.dto.AdvertDto;
import org.liberia.norway.org_api.web.dto.AdvertMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.NO_CONTENT;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/adverts")
@RequiredArgsConstructor
public class AdvertAdminController {

    private final AdvertRepository repo;
    private final FileStorageService storage;

    @GetMapping
    public Page<AdvertDto> list(Pageable pageable) {
        return repo.findAll(pageable).map(AdvertMapper::toDto);
    }

    @GetMapping("/{id}")
    public AdvertDto get(@PathVariable Long id) {
        Advert a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        return AdvertMapper.toDto(a);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(CREATED)
    public AdvertDto create(@RequestBody UpsertAdvertReq req) {
        Advert a = apply(new Advert(), req);
        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(CREATED)
    @Transactional
    public AdvertDto createMultipart(
            @RequestPart("model") UpsertAdvertReq req,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        Advert a = apply(new Advert(), req);

        if (file != null && !file.isEmpty()) {
            var stored = storage.store(file, "media"); // <-- IKKE "adverts" (adblock kan blokkere)
            a.setOriginalName(stored.originalName());
            a.setFileName(stored.fileName());
            a.setContentType(stored.contentType());
            a.setSizeBytes(stored.size());

            if (!StringUtils.hasText(a.getImageUrl())) {
                a.setImageUrl(stored.url());
            }
        }

        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AdvertDto update(@PathVariable Long id, @RequestBody UpsertAdvertReq req) {
        Advert a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        a = apply(a, req);
        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public AdvertDto updateMultipart(
            @PathVariable Long id,
            @RequestPart("model") UpsertAdvertReq req,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        Advert a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        a = apply(a, req);

        if (file != null && !file.isEmpty()) {
            var stored = storage.store(file, "media");
            a.setOriginalName(stored.originalName());
            a.setFileName(stored.fileName());
            a.setContentType(stored.contentType());
            a.setSizeBytes(stored.size());

            if (!StringUtils.hasText(a.getImageUrl())) {
                a.setImageUrl(stored.url());
            }
        }

        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    @PostMapping("/{id}/active")
    @ResponseStatus(NO_CONTENT)
    @Transactional
    public void setActive(@PathVariable Long id, @RequestParam("value") boolean value) {
        var advert = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        advert.setActive(value);
        advert.setUpdatedAt(OffsetDateTime.now());
        repo.save(advert);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private Advert apply(Advert a, UpsertAdvertReq req) {
        if (req.title != null) a.setTitle(req.title);
        if (req.description != null) a.setDescription(req.description);
        if (req.targetUrl != null) a.setTargetUrl(req.targetUrl);
        if (req.placement != null) a.setPlacement(Advert.Placement.valueOf(req.placement));
        if (req.imageUrl != null) a.setImageUrl(req.imageUrl);
        if (req.slug != null && !req.slug.isBlank()) a.setSlug(req.slug);

        a.setActive(req.active != null ? req.active : a.isActive());
        a.setStartAt(req.startAt);
        a.setEndAt(req.endAt);

        a.setUpdatedAt(OffsetDateTime.now());
        return a;
    }

    public record UpsertAdvertReq(
            String slug,
            String title,
            String description,
            String targetUrl,
            String placement,
            String imageUrl,
            Boolean active,
            OffsetDateTime startAt,
            OffsetDateTime endAt
    ) { }
}
