package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.*;
import org.liberia.norway.org_api.repository.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
public class AlbumPublicController {
  private final AlbumRepository albums;
  private final PhotoRepository photos;

  @GetMapping
  public List<Album> published() { return albums.findByIsPublishedTrueOrderByCreatedAtDesc(); }

  @GetMapping("/{slug}")
  public Map<String,Object> album(@PathVariable String slug) {
    Album a = albums.findBySlug(slug).orElseThrow();
    List<Photo> ph = photos.findByAlbumIdOrderBySortOrderAsc(a.getId());
    return Map.of("album", a, "photos", ph);
  }
}
