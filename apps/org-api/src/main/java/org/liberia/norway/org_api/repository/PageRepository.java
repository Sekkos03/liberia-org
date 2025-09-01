package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Pages;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PageRepository extends JpaRepository<Pages, Long> {

    Optional<Pages> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Pages> findByPublishedTrue(Pageable pageable);
}
