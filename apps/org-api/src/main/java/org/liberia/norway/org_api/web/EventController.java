package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.repository.EventRepository;
import org.liberia.norway.org_api.web.dto.EventResponse;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

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
}
