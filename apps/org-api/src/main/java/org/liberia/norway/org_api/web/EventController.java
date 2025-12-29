package org.liberia.norway.org_api.web;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.liberia.norway.org_api.repository.EventRepository;
import org.liberia.norway.org_api.web.dto.EventResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")  // <<— not "/api/**"
@RequiredArgsConstructor
public class EventController {
    private final EventRepository eventRepository;

    @GetMapping("/events")
    public List<EventResponse> listPublished() {
        return eventRepository.findByIsPublishedTrueOrderByStartAtAsc()
                .stream()
                .map(EventResponse::from)
                .toList();
    }

    @GetMapping("/events/next")
    public Map<String, Object> next() {
        var list = eventRepository.findUpcoming(OffsetDateTime.now());
        var first = list.isEmpty() ? null : EventResponse.from(list.getFirst());
        return Map.of(
            "hasUpcoming", first != null,
            "event", first
        );
    }
    @GetMapping("/events/{slug}")
    public EventResponse get(@PathVariable String slug) {
        return eventRepository.findBySlug(slug)
                .map(EventResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

}
