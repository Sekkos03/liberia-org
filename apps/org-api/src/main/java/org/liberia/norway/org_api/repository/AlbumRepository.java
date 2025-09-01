package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Album;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AlbumRepository extends JpaRepository<Album, Long> {

    Optional<Album> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Album> findByIsPublishedTrue(Pageable pageable);

    @Query("select count(p) from Photo p where p.album.id = :albumId")
    long countPhotos(@Param("albumId") Long albumId);
}

