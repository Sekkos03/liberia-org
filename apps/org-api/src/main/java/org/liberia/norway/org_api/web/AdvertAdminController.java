package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.liberia.norway.org_api.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/adverts")
@RequiredArgsConstructor
public class AdvertAdminController {
  private final AdvertRepository adverts;
  private final FileStorageService storage;

  @GetMapping public List<Advert> list(){ return adverts.findAll(); }

  @PostMapping public Advert create(@RequestBody Advert a){
    a.setId(null); a.setCreatedAt(OffsetDateTime.now()); a.setUpdatedAt(OffsetDateTime.now());
    return adverts.save(a);
  }

  @PutMapping("/{id}") public Advert update(@PathVariable Long id, @RequestBody Advert b) {
    Advert a = adverts.findById(id).orElseThrow();
    a.setTitle(b.getTitle()); a.setTargetUrl(b.getTargetUrl()); a.setPlacement(b.getPlacement());
    a.setStartsAt(b.getStartsAt()); a.setEndsAt(b.getEndsAt()); a.setActive(b.isActive());
    a.setUpdatedAt(OffsetDateTime.now());
    return adverts.save(a);
  }

  @PostMapping("/{id}/image")
  public Advert uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
    Advert a = adverts.findById(id).orElseThrow();
    String url = storage.store(file, "adverts");
    a.setImageUrl(url); a.setUpdatedAt(OffsetDateTime.now());
    return adverts.save(a);
  }

  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){
    adverts.deleteById(id); return ResponseEntity.noContent().build();
  }
}
