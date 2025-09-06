package org.liberia.norway.org_api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "members")
public class Member {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(length = 120) private String firstName;
  @Column(length = 120) private String lastName;
  private LocalDate dateOfBirth;
  @Column(length = 64)  private String personalNr;
  @Column(length = 256) private String address;
  @Column(length = 32)  private String postCode;
  @Column(length = 120) private String city;
  @Column(length = 64)  private String phone;
  @Column(length = 320) private String email;
  @Column(length = 160) private String occupation;

  @Column(nullable = false) private Instant createdAt = Instant.now();
  @Column(nullable = false) private Instant updatedAt = Instant.now();
  @PrePersist @PreUpdate void touch() { this.updatedAt = Instant.now(); }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }
  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }
  public LocalDate getDateOfBirth() { return dateOfBirth; }
  public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
  public String getPersonalNr() { return personalNr; }
  public void setPersonalNr(String personalNr) { this.personalNr = personalNr; }
  public String getAddress() { return address; }
  public void setAddress(String address) { this.address = address; }
  public String getPostCode() { return postCode; }
  public void setPostCode(String postCode) { this.postCode = postCode; }
  public String getCity() { return city; }
  public void setCity(String city) { this.city = city; }
  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getOccupation() { return occupation; }
  public void setOccupation(String occupation) { this.occupation = occupation; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
