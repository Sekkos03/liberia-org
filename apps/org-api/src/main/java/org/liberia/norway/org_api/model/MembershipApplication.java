package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity @Table(name="membership_applications")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MembershipApplication {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @Column(nullable=false, length=200) private String fullName;
  @Column(nullable=false, length=320) private String email;
  @Column(length=50) private String phone;
  @Column(length=400) private String address;
  @Column(length=200) private String occupation;
  @Lob private String message;

  @Column(nullable=false) private OffsetDateTime createdAt = OffsetDateTime.now();
}
