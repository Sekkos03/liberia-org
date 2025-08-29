package org.liberia.norway.org_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

import org.liberia.norway.org_api.model.*;

public interface AlbumRepository extends JpaRepository<Album, Long> {
  Optional<Album> findBySlug(String slug);
  List<Album> findByIsPublishedTrueOrderByCreatedAtDesc();
}

