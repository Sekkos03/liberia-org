package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adverts")
@RequiredArgsConstructor
public class AdvertPublicController {
  private final AdvertRepository adverts;

  @GetMapping
  public List<Advert> byPlacement(@RequestParam String placement) {
    return adverts.findByPlacementAndIsActiveTrueOrderByCreatedAtDesc(placement);
  }
}

