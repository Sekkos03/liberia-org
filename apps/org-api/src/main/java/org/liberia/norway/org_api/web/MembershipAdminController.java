package org.liberia.norway.org_api.web;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.model.Member.Status;
import org.liberia.norway.org_api.repository.MemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/membership")
public class MembershipAdminController {

  private final MemberRepository memrepo;

  public MembershipAdminController(MemberRepository memrepo) {
    this.memrepo = memrepo;
  }

  /* ----------------------------- MEMBERS ----------------------------- */
  // Members = kun ACCEPTED

  @GetMapping
  public Page<MemberDTO> listMembers(Pageable pageable) {
    return memrepo.findAllByStatusOrderByCreatedAtDesc(Status.ACCEPTED, pageable).map(MemberDTO::from);
  }

  @GetMapping("/{id}")
  public MemberDTO getMember(@PathVariable Long id) {
    var m = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (m.getStatus() != Status.ACCEPTED) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return MemberDTO.from(m);
  }

  @PostMapping
  public MemberDTO createMember(@RequestBody MemberDTO in) {
    if (in.email != null && memrepo.existsByEmailIgnoreCaseAndStatus(in.email, Status.ACCEPTED)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "This email already exists as a member.");
    }
    if (in.personalNr != null && memrepo.existsByPersonalNrAndStatus(in.personalNr, Status.ACCEPTED)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "This personal number already exists as a member.");
    }

    Member m = new Member();
    apply(m, in);
    m.setStatus(Status.ACCEPTED);
    m.setHandledAt(Instant.now());
    m.setDeleteAt(null);
    return MemberDTO.from(memrepo.save(m));
  }

  @PutMapping("/{id}")
  public MemberDTO updateMember(@PathVariable Long id, @RequestBody MemberDTO in) {
    Member m = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    if (m.getStatus() != Status.ACCEPTED) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only ACCEPTED members can be edited here.");
    }
    
    // Check for duplicate email (excluding current member)
    if (in.email != null && !in.email.equalsIgnoreCase(m.getEmail())) {
      if (memrepo.existsByEmailIgnoreCaseAndStatusAndIdNot(in.email, Status.ACCEPTED, id)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "This email already exists as a member.");
      }
    }
    
    // Check for duplicate personalNr (excluding current member)
    if (in.personalNr != null && !in.personalNr.equals(m.getPersonalNr())) {
      if (memrepo.existsByPersonalNrAndStatusAndIdNot(in.personalNr, Status.ACCEPTED, id)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "This personal number already exists as a member.");
      }
    }
    
    apply(m, in);
    return MemberDTO.from(memrepo.save(m));
  }

  @DeleteMapping("/{id}")
  public void deleteMember(@PathVariable Long id) {
    Member m = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    memrepo.delete(m);
  }

  public record MemberDTO(
      Long id,
      String firstName,
      String lastName,
      String dateOfBirth,
      String personalNr,
      String address,
      String postCode,
      String city,
      String phone,
      String email,
      String occupation,
      String vippsReference,
      Integer vippsAmountNok,
      String createdAt
  ) {
    static MemberDTO from(Member m) {
      return new MemberDTO(
          m.getId(),
          m.getFirstName(),
          m.getLastName(),
          m.getDateOfBirth() != null ? m.getDateOfBirth().toString() : null,
          m.getPersonalNr(),
          m.getAddress(),
          m.getPostCode(),
          m.getCity(),
          m.getPhone(),
          m.getEmail(),
          m.getOccupation(),
          m.getVippsReference(),
          m.getVippsAmountNok(),
          m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
      );
    }
  }

  private static void apply(Member m, MemberDTO in) {
    m.setFirstName(in.firstName);
    m.setLastName(in.lastName);
    m.setDateOfBirth(parseDate(in.dateOfBirth));
    m.setPersonalNr(n(in.personalNr));
    m.setAddress(n(in.address));
    m.setPostCode(n(in.postCode));
    m.setCity(n(in.city));
    m.setPhone(n(in.phone));
    m.setEmail(n(in.email));
    m.setOccupation(n(in.occupation));
  }

  private static LocalDate parseDate(String s) {
    try {
      return (s == null || s.isBlank()) ? null : LocalDate.parse(s);
    } catch (Exception e) {
      return null;
    }
  }

  private static String n(String s) {
    return (s == null || s.isBlank()) ? null : s.trim();
  }

  /* --------------------------- APPLICATIONS --------------------------- */

  public record ApplicationDTO(
      Long id,
      String firstName,
      String lastName,
      String dateOfBirth,
      String personalNr,
      String address,
      String postCode,
      String city,
      String email,
      String phone,
      String occupation,
      String vippsReference,
      Integer vippsAmountNok,
      String status,
      String createdAt,
      String handledAt,
      String deleteAt
  ) {
    static ApplicationDTO from(Member a) {
      return new ApplicationDTO(
          a.getId(),
          a.getFirstName(),
          a.getLastName(),
          a.getDateOfBirth() != null ? a.getDateOfBirth().toString() : null,
          a.getPersonalNr(),
          a.getAddress(),
          a.getPostCode(),
          a.getCity(),
          a.getEmail(),
          a.getPhone(),
          a.getOccupation(),
          a.getVippsReference(),
          a.getVippsAmountNok(),
          a.getStatus() != null ? a.getStatus().name() : Status.PENDING.name(),
          a.getCreatedAt() != null ? a.getCreatedAt().toString() : null,
          a.getHandledAt() != null ? a.getHandledAt().toString() : null,
          a.getDeleteAt() != null ? a.getDeleteAt().toString() : null
      );
    }
  }

  @GetMapping("/applications")
  public Page<ApplicationDTO> listApplications(
      @RequestParam(defaultValue = "PENDING") String status,
      Pageable pageable
  ) {
    Status st;
    try {
      st = Status.valueOf(status.toUpperCase());
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
    }

    return memrepo.findAllByStatusOrderByCreatedAtDesc(st, pageable).map(ApplicationDTO::from);
  }

  @PatchMapping("/applications/{id}/accept")
  public ResponseEntity<?> accept(@PathVariable Long id) {
    var a = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

    if (a.getStatus() != Status.PENDING) {
      return ResponseEntity.status(409).body("Only PENDING applications can be accepted.");
    }

    a.setStatus(Status.ACCEPTED);
    a.setHandledAt(Instant.now());
    a.setDeleteAt(null);

    memrepo.save(a);
    return ResponseEntity.ok(ApplicationDTO.from(a));
  }

  public record RejectRequest(Integer daysToKeep) {}

  @PatchMapping("/applications/{id}/reject")
  public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest req) {
    var a = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

    if (a.getStatus() != Status.PENDING) {
      return ResponseEntity.status(409).body("Only PENDING applications can be rejected.");
    }

    int days = (req != null && req.daysToKeep != null && req.daysToKeep > 0) ? req.daysToKeep : 365;

    a.setStatus(Status.REJECTED);
    a.setHandledAt(Instant.now());
    a.setDeleteAt(Instant.now().plus(days, ChronoUnit.DAYS));

    memrepo.save(a);
    return ResponseEntity.ok(ApplicationDTO.from(a));
  }

  @PatchMapping("/applications/{id}/pending")
  public ResponseEntity<?> backToPending(@PathVariable Long id) {
    var a = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

    if (a.getStatus() == Status.PENDING) {
      return ResponseEntity.status(409).body("Application is already PENDING.");
    }

    a.setStatus(Status.PENDING);
    a.setHandledAt(null);
    a.setDeleteAt(null);

    memrepo.save(a);
    return ResponseEntity.ok(ApplicationDTO.from(a));
  }
}