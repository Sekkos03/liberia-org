package org.liberia.norway.org_api.web;

import jakarta.transaction.Transactional;
import java.time.LocalDate;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

@CrossOrigin // optional if you added the global CorsFilter
@RestController
@RequestMapping("/api/membership")
public class MembershipController {
  private static final Logger log = LoggerFactory.getLogger(MembershipController.class);
  private final MemberRepository members;

  public MembershipController(MemberRepository members) { this.members = members; }

  @PostMapping(path = "/apply", consumes = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<MembershipAdminController.MemberDTO> apply(@RequestBody MemberApplyRequest req) {
    try {
      if (req.firstName == null || req.firstName.isBlank()
          || req.lastName == null || req.lastName.isBlank()) {
        return ResponseEntity.badRequest().build();
      }
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
      return ResponseEntity.status(201).body(MembershipAdminController.MemberDTO.from(saved));
    } catch (Exception ex) {
      log.error("Failed to save membership application", ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  private static LocalDate parseDate(String s) {
    try { return (s == null || s.isBlank()) ? null : LocalDate.parse(s); }
    catch (Exception e) { return null; }
  }
  private static String n(String s){ return (s==null||s.isBlank())?null:s; }

  public static final class MemberApplyRequest {
    public String firstName, lastName, dateOfBirth, personalNr, address,
                  postCode, city, phone, email, occupation;
  }
}
