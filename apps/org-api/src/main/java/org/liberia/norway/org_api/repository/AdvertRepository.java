package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.model.Advert.Placement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface AdvertRepository extends JpaRepository<Advert, Long> {

    Optional<Advert> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Advert> findByActiveTrue(Pageable pageable);

    @Query("""
           select a from Advert a
           where a.active = true
             and a.placement = :placement
             and (a.startAt is null or a.startAt <= :now)
             and (a.endAt is null or a.endAt >= :now)
           order by a.createdAt desc
           """)
    List<Advert> findVisibleByPlacement(Placement placement, OffsetDateTime now);
}
