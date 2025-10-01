package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.OffsetDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "events")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@DynamicInsert
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=200)
    private String title;

    @Column(nullable=false, length=200, unique=true)
    private String slug;

    @Column(length=500)
    private String summary;

    @Column(columnDefinition = "text")
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String description;

    @Column(length=250)
    private String location;
    @JsonProperty("start_at")
    @NotNull
    @Column(name="start_at", nullable=false)
    private OffsetDateTime startAt;

    @Column(name="end_at")
    private OffsetDateTime endAt;

    @Column(name="cover_image_url", columnDefinition = "text")
    private String coverImageUrl;

    @Column(name="gallery_album_id")
    private Long galleryAlbumId;

    @Column(name="rsvp_url", columnDefinition = "text")
    private String rsvpUrl;

    @Column(name="is_published", nullable=false)
    private boolean isPublished;

    @CreationTimestamp
    @Column(name="created_at", nullable=false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name="updated_at", nullable=false)
    private OffsetDateTime updatedAt;

   // REMOVE this broken method completely:
// public Boolean getIsPublished() { throw new UnsupportedOperationException("Unimplemented method 'getIsPublished'"); }

// Keep simple boolean accessors (ok to keep Lombok too)
public boolean isPublished() { return isPublished; }
public void setPublished(boolean isPublished) { this.isPublished = isPublished; }

}
