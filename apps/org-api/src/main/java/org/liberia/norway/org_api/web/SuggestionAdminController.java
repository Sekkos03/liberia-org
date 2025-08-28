package org.liberia.norway.org_api.web;

import org.liberia.norway.org_api.model.Suggestion;
import org.liberia.norway.org_api.repository.SuggestionRepository;
import org.liberia.norway.org_api.web.dto.SuggestionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/suggestions")
public class SuggestionAdminController {

    private final SuggestionRepository repo;

    public SuggestionAdminController(SuggestionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public Page<SuggestionResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status
    ) {
        var pageable = PageRequest.of(page, size);
        Page<Suggestion> p = (status == null || status.isBlank())
                ? repo.findAllByOrderByCreatedAtDesc(pageable)
                : repo.findByStatusOrderByCreatedAtDesc(status, pageable);

        return p.map(s -> new SuggestionResponse(
                s.getId(), s.getName(), s.getEmail(), s.getMessage(), s.getStatus(), s.getCreatedAt()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuggestionResponse> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(s -> ResponseEntity.ok(new SuggestionResponse(
                        s.getId(), s.getName(), s.getEmail(), s.getMessage(), s.getStatus(), s.getCreatedAt()
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Object> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return repo.findById(id).map(s -> {
            s.setStatus(status);
            repo.save(s);
            return ResponseEntity.noContent().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
