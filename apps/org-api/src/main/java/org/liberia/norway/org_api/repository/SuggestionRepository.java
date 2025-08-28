package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Suggestion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {
    Page<Suggestion> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Suggestion> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
