package org.liberia.norway.org_api.repository;

import java.time.Instant;
import java.util.Optional;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.model.Member.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberRepository extends JpaRepository<Member, Long> {
  boolean existsByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCaseAndStatus(String email, Status status);

  Page<Member> findAllByOrderByCreatedAtDesc(Pageable pageable);
  Page<Member> findAllByStatusOrderByCreatedAtDesc(Status status, Pageable pageable);

  long deleteByStatusAndDeleteAtBefore(Status status, Instant now);

 boolean existsByEmailIgnoreCaseAndStatusAndIdNot(String email, Member.Status status, Long id);

  @Query("""
    select m
    from Member m
    where m.status = :status
  """)
  Page<Member> findMembers(@Param("status") Status status, Pageable pageable);
 void deleteAllByStatusAndDeleteAtBefore(Member.Status status, Instant now);


   Optional<Member> findByEmailIgnoreCase(String email);

   Page<Member> findByStatus(Status status, Pageable pageable);

   @Query("select m from Member m where m.status = 'ACCEPTED'")
Page<Member> findAccepted(Pageable pageable);

  // 1) Delete med email (case-insensitive). Returnerer antall rader slettet.
  long deleteByEmailIgnoreCase(String email);

  // 2) Valgfritt: alias-metoder så controlleren kan bruke existsByEmail / deleteByEmail
  default boolean existsByEmail(String email) {
  return existsByEmailIgnoreCase(email);
  }

  default long deleteByEmail(String email) {
  return deleteByEmailIgnoreCase(email);
  }
   Optional<Member> findByEmail(String email);

  // Brukes for å unngå konflikt ved accept hvis det allerede finnes en ACCEPTED member med samme email
  boolean existsByEmailAndStatus(String email, Status status);

  boolean existsByEmailAndStatusAndIdNot(String email, Status status, Long id);
}