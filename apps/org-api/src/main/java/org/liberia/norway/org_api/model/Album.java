package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "albums",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_albums_slug", columnNames = "slug")
    }
)
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120, nullable = false)
    private String slug;

    @Column(length = 200, nullable = false)
    private String title;

    // DDL says CLOB -> map as @Lob String
    @Lob
    @Column
    private String description;

    // Optional FK to photos.id
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_photo_id", foreignKey = @ForeignKey(name = "fk_albums_cover"))
    private Photo coverPhoto;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished; // defaults to false (Java default)

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private Set<Photo> photos = new LinkedHashSet<>();

    @PrePersist
    void onCreate() {
        final OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
