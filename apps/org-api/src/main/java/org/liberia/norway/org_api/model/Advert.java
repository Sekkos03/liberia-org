package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="adverts")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Advert {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @Column(nullable=false, length=200) private String title;
  @Column(nullable=false, length=500) private String imageUrl;
  @Column(length=500) private String targetUrl;
  @Column(nullable=false, length=50) private String placement; // e.g. HEADER/SIDEBAR
  private OffsetDateTime startsAt;
  private OffsetDateTime endsAt;
  @Column(nullable=false) private boolean isActive = false;

  @Column(nullable=false) private OffsetDateTime createdAt = OffsetDateTime.now();
  @Column(nullable=false) private OffsetDateTime updatedAt = OffsetDateTime.now();
}
