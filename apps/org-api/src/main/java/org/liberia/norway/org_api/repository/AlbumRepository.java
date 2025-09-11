package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Album;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AlbumRepository extends JpaRepository<Album, Long> {

    // Behold gjerne denne hvis du allerede har den
    @Query(value = "SELECT * FROM albums WHERE slug = :slug LIMIT 1", nativeQuery = true)
    boolean findBySlug(@Param("slug") String slug);

    // Liste over publiserte album som Page
    @Query(
        value = """
                SELECT * FROM albums
                WHERE is_published = true
                ORDER BY created_at DESC
                """,
        countQuery = "SELECT COUNT(*) FROM albums WHERE is_published = true",
        nativeQuery = true
    )
    Page<Album> findPublished(Pageable pageable);

    // Ett publisert album på slug
    @Query(value = "SELECT * FROM albums WHERE slug = :slug AND is_published = true LIMIT 1", nativeQuery = true)
    Optional<Album> findPublishedBySlug(@Param("slug") String slug);
}

