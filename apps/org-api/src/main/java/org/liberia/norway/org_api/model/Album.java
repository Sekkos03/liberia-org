package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.List;

@Entity @Table(name = "albums")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Album {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 160)
  private String slug;

  @Column(nullable = false, length = 200)
  private String title;

  @Lob
  private String description;

  private String coverImageUrl;

  @Builder.Default
  private boolean isPublished = false;

  @Builder.Default
  private Instant createdAt = Instant.now();

  @Builder.Default
  private Instant updatedAt = Instant.now();

  @OneToMany(mappedBy = "album", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("sortOrder asc, id asc")
  private List<Photo> photos;
}
 {
    
}
