package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="users")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserAccount {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @Column(nullable=false, unique=true, length=100) private String username;
  @Column(nullable=false, length=200) private String password; // BCrypt
  @Column(nullable=false, length=50) private String role = "ADMIN";
  @Column(nullable=false) private boolean enabled = true;

  @Column(nullable=false) private OffsetDateTime createdAt = OffsetDateTime.now();
}
