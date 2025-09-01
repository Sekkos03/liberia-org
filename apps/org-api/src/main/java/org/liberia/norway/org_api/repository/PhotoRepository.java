package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Photo;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findByAlbum_IdOrderBySortOrderAsc(Long albumId);

    List<Photo> findByAlbum_IdAndIsPublishedTrueOrderBySortOrderAsc(Long albumId);

    long countByAlbum_Id(Long albumId);

    Optional<Photo> findByIdAndAlbum_Id(Long id, Long albumId);

    @Query("select coalesce(max(p.sortOrder), 0) from Photo p where p.album.id = :albumId")
    int maxSortOrder(@Param("albumId") Long albumId);
}
