package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.OffsetDateTime;

@Entity
@Table(name = "pages", indexes = {
        @Index(name = "idx_pages_slug", columnList = "slug", unique = true),
        @Index(name = "idx_pages_published", columnList = "published")
})
@Getter
@Setter
@ToString
public class Pages {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false)
    private String body; // CLOB i SQL

    @Column(nullable = false)
    private boolean published = false;

    private OffsetDateTime publishedAt;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
