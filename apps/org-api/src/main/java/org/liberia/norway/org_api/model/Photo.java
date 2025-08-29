package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.OffsetDateTime;

@Entity @Table(name="photos")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Photo {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional=false) @JoinColumn(name="album_id")
  private Album album;

  private String title;
  @Lob private String description;
  @Column(nullable=false) private String imageUrl;
  @Column(nullable=false) private int sortOrder = 0;
  private Instant takenAt;

  @Column(nullable=false) private OffsetDateTime createdAt = OffsetDateTime.now();
  @Column(nullable=false) private OffsetDateTime updatedAt = OffsetDateTime.now();
}
