package org.liberia.norway.org_api.web;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.model.Member.Status;
import org.liberia.norway.org_api.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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

  private static final Logger log = LoggerFactory.getLogger(MembershipAdminController.class);

  private final MemberRepository memrepo;
  private final JavaMailSender mailSender;

  public MembershipAdminController(MemberRepository memrepo, JavaMailSender mailSender) {
    this.memrepo = memrepo;
    this.mailSender = mailSender;
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
    
    // Send acceptance email
    sendAcceptanceEmail(a);

    return ResponseEntity.ok(ApplicationDTO.from(a));
  }

  public record RejectRequest(Integer daysToKeep, String reason) {}

  @PatchMapping("/applications/{id}/reject")
  public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody(required = false) RejectRequest req) {
    var a = memrepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

    if (a.getStatus() != Status.PENDING) {
      return ResponseEntity.status(409).body("Only PENDING applications can be rejected.");
    }

    int days = (req != null && req.daysToKeep != null && req.daysToKeep > 0) ? req.daysToKeep : 365;
    String reason = (req != null && req.reason != null && !req.reason.isBlank()) ? req.reason.trim() : null;

    a.setStatus(Status.REJECTED);
    a.setHandledAt(Instant.now());
    a.setDeleteAt(Instant.now().plus(days, ChronoUnit.DAYS));

    memrepo.save(a);
    
    // Send rejection email
    sendRejectionEmail(a, reason);

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

  /* --------------------------- EMAIL METHODS --------------------------- */

  private void sendAcceptanceEmail(Member member) {
    if (member.getEmail() == null || member.getEmail().isBlank()) {
      log.warn("Cannot send acceptance email: no email address for member id={}", member.getId());
      return;
    }

    try {
      String to = member.getEmail().trim();
      String subject = "Welcome to ULAN - Membership Approved!";

      String body = """
          Dear %s %s,

          Congratulations! We are pleased to inform you that your membership application to the Union of Liberians Association in Norway (ULAN) has been approved.

          You are now an official member of ULAN!

          We look forward to seeing you at our upcoming events and activities.

          If you have any questions, please don't hesitate to contact us.

          Welcome to the ULAN family!

          Kind regards,
          ULAN Administration
          Union of Liberians Association in Norway
          """.formatted(
              member.getFirstName() == null ? "" : member.getFirstName(),
              member.getLastName() == null ? "" : member.getLastName()
          );

      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setTo(to);
      msg.setSubject(subject);
      msg.setText(body);

      mailSender.send(msg);
      log.info("Acceptance email sent to: {}", to);
    } catch (Exception e) {
      log.error("Failed to send acceptance email to member id={}", member.getId(), e);
    }
  }

  private void sendRejectionEmail(Member member, String reason) {
    if (member.getEmail() == null || member.getEmail().isBlank()) {
      log.warn("Cannot send rejection email: no email address for member id={}", member.getId());
      return;
    }

    try {
      String to = member.getEmail().trim();
      String subject = "ULAN Membership Application Status";

      String reasonText = (reason != null && !reason.isBlank()) 
          ? "\n\nReason: " + reason + "\n"
          : "";

      String body = """
          Dear %s %s,

          Thank you for your interest in becoming a member of the Union of Liberians Association in Norway (ULAN).

          After reviewing your application, we regret to inform you that we are unable to approve your membership at this time.%s
          If you believe this decision was made in error or if you have additional information that may support your application, please feel free to contact our administration team.

          You are welcome to reapply in the future.

          Thank you for your understanding.

          Kind regards,
          ULAN Administration
          Union of Liberians Association in Norway
          """.formatted(
              member.getFirstName() == null ? "" : member.getFirstName(),
              member.getLastName() == null ? "" : member.getLastName(),
              reasonText
          );

      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setTo(to);
      msg.setSubject(subject);
      msg.setText(body);

      mailSender.send(msg);
      log.info("Rejection email sent to: {}", to);
    } catch (Exception e) {
      log.error("Failed to send rejection email to member id={}", member.getId(), e);
    }
  }
}