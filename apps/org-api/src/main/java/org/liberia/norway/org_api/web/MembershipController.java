package org.liberia.norway.org_api.web;

import java.time.LocalDate;
import java.util.Map;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;


@CrossOrigin // optional if you added the global CorsFilter
@RestController
@RequestMapping("/api/membership")
public class MembershipController {
  private static final Logger log = LoggerFactory.getLogger(MembershipController.class);

  private static final int MEMBERSHIP_FEE_NOK = 300;

  private final MemberRepository members;

 private final JavaMailSender mailSender;

public MembershipController(MemberRepository members, JavaMailSender mailSender) {
  this.members = members;
  this.mailSender = mailSender;
}

  // ✅ Ny: sjekk om medlem finnes (brukes før Vipps-steget)
  @GetMapping("/exists")
  public Map<String, Boolean> exists(
      @RequestParam(required = false) String email,
      @RequestParam(required = false) String personalNr
  ) {
    boolean byEmail = email != null && !email.isBlank() && members.existsByEmailIgnoreCase(email.trim());
    boolean byPn = personalNr != null && !personalNr.isBlank() && members.existsByPersonalNr(personalNr.trim());
    return Map.of("exists", byEmail || byPn);
  }

  @PostMapping(path = "/apply", consumes = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<?> apply(@RequestBody MemberApplyRequest req) {
    try {
      // basic validation
      if (req.firstName == null || req.firstName.isBlank()
          || req.lastName == null || req.lastName.isBlank()
          || req.email == null || req.email.isBlank()
          || req.personalNr == null || req.personalNr.isBlank()) {
        return ResponseEntity.badRequest().body("Fyll inn alle nødvendige felter.");
      }

      // ✅ 1) Sjekk om allerede medlem -> 409
      String email = req.email.trim();
      String pn = req.personalNr.trim();

      boolean exists = members.existsByEmailIgnoreCase(email) || members.existsByPersonalNr(pn);
      if (exists) {
        return ResponseEntity.status(409).body("Du er allerede medlem.");
      }

      // ✅ 2) Vipps må være bekreftet -> ellers 400 "Betal..."
      // (frontend stopper også, men dette sikrer backend)
      if (req.vippsConfirmed == null || !req.vippsConfirmed) {
        return ResponseEntity.badRequest().body("Betal med Vipps 300kr for å fullføre medlemskap.");
      }
      if (req.vippsReference == null || req.vippsReference.isBlank()) {
        return ResponseEntity.badRequest().body("Betal med Vipps 300kr og skriv inn kvittering/reference.");
      }
      if (req.vippsAmountNok == null || req.vippsAmountNok.isBlank()) {
        return ResponseEntity.badRequest().body("Betal med Vipps 300kr for å fullføre medlemskap.");
      }

      int amount;
      try {
        amount = Integer.parseInt(req.vippsAmountNok.trim());
      } catch (Exception e) {
        return ResponseEntity.badRequest().body("Ugyldig Vipps-beløp.");
      }

      if (amount != MEMBERSHIP_FEE_NOK) {
        return ResponseEntity.badRequest().body("Vipps-beløpet må være 300kr for medlemskap.");
      }

      // ✅ 3) Lagre medlem
      Member m = new Member();
      m.setFirstName(req.firstName);
      m.setLastName(req.lastName);
      m.setDateOfBirth(parseDate(req.dateOfBirth));
      m.setPersonalNr(n(req.personalNr));
      m.setAddress(n(req.address));
      m.setPostCode(n(req.postCode));
      m.setCity(n(req.city));
      m.setPhone(n(req.phone));
      m.setEmail(n(req.email));
      m.setOccupation(n(req.occupation));

      Member saved = members.save(m);
      sendConfirmationEmail(saved, req.vippsReference, amount);


      // ✅ 4) (Valgfritt) Send e-postbekreftelse her (se seksjon under)
      // sendConfirmationEmail(saved, req.vippsReference, amount);

      return ResponseEntity.status(201).body(MembershipAdminController.MemberDTO.from(saved));
    } catch (Exception ex) {
      log.error("Failed to save membership application", ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  private static LocalDate parseDate(String s) {
    try {
      return (s == null || s.isBlank()) ? null : LocalDate.parse(s);
    } catch (Exception e) {
      return null;
    }
  }

  private static String n(String s) {
    return (s == null || s.isBlank()) ? null : s;
  }

  public static final class MemberApplyRequest {
    public String firstName, lastName, dateOfBirth, personalNr, address,
        postCode, city, phone, email, occupation;

    // ✅ Ny: Vipps fields fra frontend step 2
    public String vippsAmountNok;     // "300"
    public String vippsReference;     // kvittering / ref
    public Boolean vippsConfirmed;    // true/false
  }

  // --------------------------
  // OPTIONAL: Email confirmation (se under)
  // --------------------------

   private void sendConfirmationEmail(Member member, String vippsRef, int amountNok) {
    // Bruk din foretrukne e-posttjeneste / bibliotek her.
    // Eksempel med JavaMailSender (Spring Boot):
    String to = member.getEmail();
    String subject = "Medlemskap Bekreftelse";
    String body = String.format("Kjære %s %s,\n\nTakk for at du ble medlem! Vi har mottatt din betaling på %d NOK via Vipps (Ref: %s).\n\nMed vennlig hilsen,\nULAN (Union Of Liberian Associtations in Norway)",
        member.getFirstName(), member.getLastName(), amountNok, vippsRef);

    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(to);
    message.setSubject(subject);
    message.setText(body);

    mailSender.send(message);
  } 

}
  
 