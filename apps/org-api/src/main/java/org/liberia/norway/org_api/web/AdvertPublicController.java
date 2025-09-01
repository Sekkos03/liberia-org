package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.model.Advert.Placement;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/adverts")
@RequiredArgsConstructor
public class AdvertPublicController {

    private final AdvertRepository adverts;

    @GetMapping
    public List<AdvertItem> list(@RequestParam Placement placement) {
        var now = OffsetDateTime.now();
        return adverts.findVisibleByPlacement(placement, now)
                .stream()
                .map(a -> new AdvertItem(a.getId(), a.getTitle(), a.getImageUrl(), a.getTargetUrl(), a.getSlug()))
                .toList();
    }

    public record AdvertItem(Long id, String title, String imageUrl, String targetUrl, String slug) {}
}

