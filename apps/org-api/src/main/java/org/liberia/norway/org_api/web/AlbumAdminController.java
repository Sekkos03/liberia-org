package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.*;
import org.liberia.norway.org_api.repository.*;
import org.liberia.norway.org_api.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/albums")
@RequiredArgsConstructor
public class AlbumAdminController {

  private final AlbumRepository albums;
  private final PhotoRepository photos;
  private final FileStorageService storage;

  @GetMapping public List<Album> list() { return albums.findAll(); }

  @PostMapping
  public Album create(@RequestBody Album a) {
    a.setId(null);
    a.setCreatedAt(OffsetDateTime.now());
    a.setUpdatedAt(OffsetDateTime.now());
    return albums.save(a);
  }

  @PutMapping("/{id}")
  public Album update(@PathVariable Long id, @RequestBody Album a) {
    Album cur = albums.findById(id).orElseThrow();
    cur.setSlug(a.getSlug());
    cur.setTitle(a.getTitle());
    cur.setDescription(a.getDescription());
    cur.setCoverImageUrl(a.getCoverImageUrl());
    cur.setPublished(a.isPublished());
    cur.setUpdatedAt(OffsetDateTime.now());
    return albums.save(cur);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    albums.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/cover")
  public Album uploadCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
    Album a = albums.findById(id).orElseThrow();
    String url = storage.store(file, "albums/" + a.getSlug());
    a.setCoverImageUrl(url);
    a.setUpdatedAt(OffsetDateTime.now());
    return albums.save(a);
  }

  @PostMapping("/{id}/photos")
  @Transactional
  public Photo addPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file,
                        @RequestParam(value="title", required=false) String title) throws IOException {
    Album a = albums.findById(id).orElseThrow();
    String url = storage.store(file, "albums/" + a.getSlug());
    int nextOrder = photos.findByAlbumIdOrderBySortOrderAsc(id).size() + 1;
    Photo p = Photo.builder()
            .album(a).title(title).imageUrl(url).sortOrder(nextOrder)
            .createdAt(OffsetDateTime.now()).updatedAt(OffsetDateTime.now()).build();
    return photos.save(p);
  }
}
