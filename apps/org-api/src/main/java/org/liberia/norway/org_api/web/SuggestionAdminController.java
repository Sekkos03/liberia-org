package org.liberia.norway.org_api.web;

import java.util.Map;

import org.liberia.norway.org_api.model.Suggestion;
import org.liberia.norway.org_api.repository.SuggestionRepository;
import org.liberia.norway.org_api.web.dto.SuggestionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    /**
     * Eksisterende: PATCH /api/admin/suggestions/{id}/status?status=HANDLED
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Object> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return repo.findById(id).map(s -> {
            s.setStatus(status);
            repo.save(s);
            return ResponseEntity.noContent().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * ✅ NY: PATCH /api/admin/suggestions/{id}/handled
     * Body (valgfritt): { "handled": true/false }
     * Default: true
     */
    @PatchMapping("/{id}/handled")
    public ResponseEntity<SuggestionResponse> setHandled(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        boolean handled = true;

        if (body != null && body.containsKey("handled")) {
            Object v = body.get("handled");
            if (v instanceof Boolean b) handled = b;
            else if (v instanceof String s) handled = Boolean.parseBoolean(s);
            else if (v instanceof Number n) handled = n.intValue() != 0;
        }

        final String newStatus = handled ? "HANDLED" : "NEW";

        return repo.findById(id)
                .map(s -> {
                    s.setStatus(newStatus);
                    repo.save(s);
                    return ResponseEntity.ok(new SuggestionResponse(
                            s.getId(), s.getName(), s.getEmail(), s.getMessage(), s.getStatus(), s.getCreatedAt()
                    ));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * ✅ Admin delete
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
