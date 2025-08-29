package org.liberia.norway.org_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

import org.liberia.norway.org_api.model.*;

public interface PageRepository extends JpaRepository<Page, Long> {
    Optional<Page> findBySlugAndIsPublishedTrue(String slug);
}