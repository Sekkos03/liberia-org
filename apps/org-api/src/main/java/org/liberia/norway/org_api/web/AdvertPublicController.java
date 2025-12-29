package org.liberia.norway.org_api.web;

import java.time.OffsetDateTime;

import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.liberia.norway.org_api.web.dto.AdvertDto;
import org.liberia.norway.org_api.web.dto.AdvertMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/adverts")
@RequiredArgsConstructor
public class AdvertPublicController {

    private final AdvertRepository repo;

    // Liste kun aktive (innen tidsvindu)
    @GetMapping
    public Page<AdvertDto> list(Pageable pageable) {
        return repo.findAllPublic(OffsetDateTime.now(), pageable).map(AdvertMapper::toDto);
    }

    // Hent én annonse (kun om den er aktiv/gyldig akkurat nå)
    @GetMapping("/{slug}")
    public AdvertDto get(@PathVariable String slug) {
        var a = repo.findBySlug(slug)
                .filter(Advert::isActive)
                .filter(ad -> ad.getStartAt() == null || !ad.getStartAt().isAfter(OffsetDateTime.now()))
                .filter(ad -> ad.getEndAt() == null || !ad.getEndAt().isBefore(OffsetDateTime.now()))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        return AdvertMapper.toDto(a);
    }
}
