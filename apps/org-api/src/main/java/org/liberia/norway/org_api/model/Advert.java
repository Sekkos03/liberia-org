package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.Locale;

@Entity
@Table(name = "adverts", indexes = {
        @Index(name = "idx_adverts_slug", columnList = "slug", unique = true),
        @Index(name = "idx_adverts_active", columnList = "active")
})
@Getter @Setter @ToString
public class Advert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    private String description; // CLOB i SQL

    @Column(name = "target_url", length = 512)
    private String targetUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Placement placement = Placement.SIDEBAR;

    // Bildemetadata for opplastet annonse
    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "image_url", length = 512)
    private String imageUrl; // kan også brukes til video-url om det ikke lastes opp fil

    @Column(nullable = false)
    private boolean active = false;

    private OffsetDateTime startAt; // valgfritt tidsvindu
    private OffsetDateTime endAt;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    public enum Placement {
        HOME_TOP, SIDEBAR, FOOTER, INLINE
    }

    @PrePersist
    void onCreate() {
        final var now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.slug == null || this.slug.isBlank()) {
            this.slug = slugify(this.title);
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
        if (this.slug == null || this.slug.isBlank()) {
            this.slug = slugify(this.title);
        }
    }

    private static String slugify(String input) {
        if (input == null) return null;
        String s = input.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return s.isBlank() ? null : s;
    }
}
