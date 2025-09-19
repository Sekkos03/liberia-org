package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByIsPublishedTrueOrderByStartAtAsc();

    @Query("""
           select e from Event e
           where e.isPublished = true and e.startAt >= :now
           order by e.startAt asc
           """)
    List<Event> findUpcoming(OffsetDateTime now);

    Optional<Event> findBySlug(String slug);
    boolean existsBySlug(String slug);
    
}
