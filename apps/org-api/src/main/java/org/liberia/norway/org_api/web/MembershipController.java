package org.liberia.norway.org_api.web;

import java.time.Instant;
import java.time.LocalDate;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.model.Member.Status;
import org.liberia.norway.org_api.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.transaction.Transactional;

@CrossOrigin
@RestController
@RequestMapping("/api/membership")
public class MembershipController {
  private static final Logger log = LoggerFactory.getLogger(MembershipController.class);
  
  private static final int MEMBERSHIP_FEE_NOK = 300;

private final org.springframework.mail.javamail.JavaMailSender mailSender;

  private final MemberRepository memrepo;

  public MembershipController(MemberRepository memrepo, JavaMailSender mailSender) {
    this.memrepo = memrepo;
    this.mailSender = mailSender;
  }

  @GetMapping("/exists")
public boolean exists(@RequestParam String email) {
  return memrepo.existsByEmailIgnoreCaseAndStatus(email, Status.ACCEPTED);
}


  @PostMapping(path = "/apply", consumes = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<?> apply(@RequestBody MemberApplyRequest req) {
    try {
      // Basic validation
      if (isBlank(req.firstName) || isBlank(req.lastName) || isBlank(req.email) || isBlank(req.personalNr)) {
        return ResponseEntity.badRequest().body("Please fill in all required fields.");
      }

      String email = req.email.trim();
      String pn = req.personalNr.trim();

      if (memrepo.existsByEmailIgnoreCaseAndStatus(req.email, Status.ACCEPTED)) {
  throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already a member.");
}

if (memrepo.existsByEmailIgnoreCaseAndStatus(req.email, Status.PENDING)) {
  throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending application.");
}

if (memrepo.existsByEmailIgnoreCaseAndStatus(req.email, Status.REJECTED)) {
  throw new ResponseStatusException(HttpStatus.CONFLICT, "Your application was rejected. Contact admin.");
}

if (req.personalNr != null && memrepo.existsByPersonalNrAndStatus(req.personalNr, Status.ACCEPTED)) {
  throw new ResponseStatusException(HttpStatus.CONFLICT, "Personal number already exists as a member.");
}


      // Vipps validation
      if (req.vippsConfirmed == null || !req.vippsConfirmed) {
        return ResponseEntity.badRequest().body("Please pay with Vipps before submitting your application.");
      }
      if (isBlank(req.vippsReference)) {
        return ResponseEntity.badRequest().body("Please enter your Vipps transaction reference.");
      }
      if (isBlank(req.vippsAmountNok)) {
        return ResponseEntity.badRequest().body("Vipps amount is required.");
      }

      int amount;
      try {
        amount = Integer.parseInt(req.vippsAmountNok.trim());
      } catch (Exception e) {
        return ResponseEntity.badRequest().body("Invalid Vipps amount.");
      }

      if (amount != MEMBERSHIP_FEE_NOK) {
        return ResponseEntity.badRequest().body("Vipps amount must be 300 NOK.");
      }

      // Create application (PENDING)
      Member a = new Member();
      a.setFirstName(req.firstName.trim());
      a.setLastName(req.lastName.trim());
      a.setDateOfBirth(parseDate(req.dateOfBirth));
      a.setPersonalNr(pn);
      a.setAddress(n(req.address));
      a.setPostCode(n(req.postCode));
      a.setCity(n(req.city));
      a.setPhone(n(req.phone));
      a.setEmail(email);
      a.setOccupation(n(req.occupation));
      a.setVippsAmountNok(amount);
      a.setVippsReference(req.vippsReference.trim());
      a.setStatus(Status.PENDING);
      a.setHandledAt(null);
      a.setDeleteAt(null);
      a.setCreatedAt(Instant.now());

      a = memrepo.save(a);
      sendApplicationReceivedEmail(a);


      // Return minimal response (frontend doesn't need member info)
      return ResponseEntity.status(201).body(java.util.Map.of(
          "id", a.getId(),
          "status", a.getStatus().name()
      ));
    } catch (Exception ex) {
      log.error("Failed to save membership application", ex);
      return ResponseEntity.internalServerError().body("Server error.");
    }
  }

  private static boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  private static LocalDate parseDate(String s) {
    try { return (s == null || s.isBlank()) ? null : LocalDate.parse(s); }
    catch (Exception e) { return null; }
  }

  private static String n(String s) {
    return (s == null || s.isBlank()) ? null : s.trim();
  }

  public static final class MemberApplyRequest {
    public String firstName, lastName, dateOfBirth, personalNr, address,
        postCode, city, phone, email, occupation;

    public String vippsAmountNok;
    public String vippsReference;
    public Boolean vippsConfirmed;
  }

  private void sendApplicationReceivedEmail(Member app) {
  if (app.getEmail() == null || app.getEmail().isBlank()) return;

  String to = app.getEmail().trim();
  String subject = "ULAN Membership Application Received";

  String body = """
      Hello %s %s,

      We have received your membership application and it is now under review by our administration team.

      What happens next:
      - An admin will verify your Vipps transaction reference.
      - If approved, you will receive a confirmation email that you are now a member of ULAN.

      Thank you for applying.

      Kind regards,
      ULAN
      """.formatted(
          app.getFirstName() == null ? "" : app.getFirstName(),
          app.getLastName() == null ? "" : app.getLastName()
      );

  org.springframework.mail.SimpleMailMessage msg = new org.springframework.mail.SimpleMailMessage();
  msg.setTo(to);
  msg.setSubject(subject);
  msg.setText(body);

  mailSender.send(msg);
}

}

 