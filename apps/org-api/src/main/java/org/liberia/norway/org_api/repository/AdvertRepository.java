package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Advert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface AdvertRepository extends JpaRepository<Advert, Long> {

    Optional<Advert> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("""
           select a from Advert a
           where a.active = true
             and (a.startAt is null or a.startAt <= :now)
             and (a.endAt   is null or a.endAt   >= :now)
           order by a.createdAt desc
           """)
    Page<Advert> findAllPublic(@Param("now") OffsetDateTime now, Pageable pageable);
}
