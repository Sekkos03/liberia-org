package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="pages")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Page {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @Column(nullable=false, unique=true, length=120) private String slug;
  @Column(nullable=false, length=200) private String title;
  @Lob @Column(nullable=false) private String content; // CLOB
  @Column(nullable=false) private boolean isPublished = false;

  @Column(nullable=false) private OffsetDateTime updatedAt = OffsetDateTime.now();
  @Column(nullable=false) private OffsetDateTime createdAt = OffsetDateTime.now();
}
