package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "suggestions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Suggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // matches bigserial
    private Long id;

    @Column(length = 200)
    private String name;

    @Column(length = 320)
    private String email;

    // V1 uses TEXT; on H2 this is a CLOB, so map as @Lob to avoid validation errors
    @Column(columnDefinition = "text")
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String message;

    @Column(length = 20, nullable = false)
    private String status; // NEW | REVIEWED | ARCHIVED

    @Lob
    @Column(name = "internal_notes", columnDefinition = "text")
    private String internalNotes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (status == null) status = "NEW";
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
