package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.liberia.norway.org_api.service.FileStorageService.StoredFile;

@Entity
@Table(name = "albums")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Album {

    public enum MediaType { IMAGE, VIDEO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String slug;

    @Column(nullable = false, length = 256)
    private String title;

    @Lob
    @Basic(fetch = FetchType.LAZY)   // valgfritt, fint for store tekster
    @Column(name = "description")
    private String description;

    @Column(name = "is_published", nullable = false)
    private boolean published = false;


    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Mediaelementene som tilhører albumet. */
    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<MediaItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        final Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addItem(MediaItem it) {
        if (items == null) items = new ArrayList<>();
        items.add(it);
        it.setAlbum(this);
        // sørg for deterministisk rekkefølge
        items.sort(Comparator.comparing(MediaItem::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
    }

    public void removeItem(MediaItem it) {
        if (items != null) items.remove(it);
        it.setAlbum(null);
    }

    /* --------------------- NESTET ENTITY FOR MEDIA --------------------- */

    @Entity
    @Table(name = "album_items")
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItem {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        /** Tilbakepeker til albumet. */
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "album_id", nullable = false)
        private Album album;

        /** Frivillig tittel/tekst. */
        @Column(length = 256)
        private String title;

        /** Direkte visnings-URL dersom satt (brukes først). */
        @Column(name = "url", length = 1024)
        private String url;

        /** Alternativt – separate felter om dere skiller bilde/video. */
        @Column(name = "image_url", length = 1024)
        private String imageUrl;

        @Column(name = "video_url", length = 1024)
        private String videoUrl;

        /** Filnavn når fil er lagret lokalt (brukes til /uploads/albums/{fileName}). */
        @Column(name = "file_name", length = 512)
        private String fileName;

        /** Thumbnail-forhåndsvisning (valgfritt). */
        @Column(name = "thumb_url", length = 1024)
        private String thumbUrl;

        /** MIME-type (image/jpeg, video/mp4, …). */
        @Column(name = "content_type", length = 128)
        private String contentType;

        @Column(name = "size_bytes")
        private Long sizeBytes;

        @Column(name = "created_at", updatable = false)
        private Instant createdAt;
        
        @Enumerated(EnumType.STRING)
        @Column(name = "media_type", nullable = false)
        private MediaType mediaType;

        @PrePersist
        public void prePersist() {
            this.createdAt = Instant.now();
        }

        /* (Valgfritt) en enkel "kind" dersom dere ønsker det i DB */
        @Column(name = "kind", length = 16)
        private String kind; // "IMAGE" / "VIDEO" (kan settes i controller på upload)
    }
}
