package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Page;
import org.liberia.norway.org_api.repository.PageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/pages")
@RequiredArgsConstructor
public class PageAdminController {
  private final PageRepository pages;

  @GetMapping public List<Page> list(){ return pages.findAll(); }

  @PostMapping public Page create(@RequestBody Page p){
    p.setId(null); p.setCreatedAt(OffsetDateTime.now()); p.setUpdatedAt(OffsetDateTime.now());
    return pages.save(p);
  }

  @PutMapping("/{id}") public Page update(@PathVariable Long id, @RequestBody Page b){
    Page p = pages.findById(id).orElseThrow();
    p.setSlug(b.getSlug()); p.setTitle(b.getTitle()); p.setContent(b.getContent());
    p.setPublished(b.isPublished()); p.setUpdatedAt(OffsetDateTime.now());
    return pages.save(p);
  }

  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){
    pages.deleteById(id); return ResponseEntity.noContent().build();
  }
}
