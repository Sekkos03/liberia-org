package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.Page;
import org.liberia.norway.org_api.repository.PageRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class PagePublicController {
  private final PageRepository pages;

  @GetMapping("/{slug}")
  public Page get(@PathVariable String slug){
    return pages.findBySlugAndIsPublishedTrue(slug).orElseThrow();
  }
}
