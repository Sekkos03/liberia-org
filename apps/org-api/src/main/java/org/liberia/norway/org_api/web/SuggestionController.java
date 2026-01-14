package org.liberia.norway.org_api.web;

import java.util.Map;

import org.liberia.norway.org_api.model.Suggestion;
import org.liberia.norway.org_api.repository.SuggestionRepository;
import org.liberia.norway.org_api.web.dto.SuggestionRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/suggestions") // ✅ path only, no 'method = ...' here
public class SuggestionController {

    private final SuggestionRepository suggestionRepository;

    public SuggestionController(SuggestionRepository suggestionRepository) {
        this.suggestionRepository = suggestionRepository;
    }

    @PostMapping(consumes = "application/json")
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody SuggestionRequest req) {
        var saved = suggestionRepository.save(
            Suggestion.builder()
                .name(req.name())
                .email(req.email())
                .message(req.message())
                .status("NEW")
                .build()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", saved.getId(),
            "status", saved.getStatus(),
            "createdAt", saved.getCreatedAt()
        ));
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(
            suggestionRepository.findAll().stream().map(s -> Map.of(
                "id", s.getId(),
                "name", s.getName(),
                "email", s.getEmail(),
                "message", s.getMessage(),
                "status", s.getStatus(),
                "createdAt", s.getCreatedAt()
            )).toList()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (suggestionRepository.existsById(id)) {
            suggestionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return suggestionRepository.findById(id)
            .map(s -> {
                s.setStatus(status);
                suggestionRepository.save(s);
                return ResponseEntity.ok(Map.of("id", s.getId(), "status", s.getStatus()));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
