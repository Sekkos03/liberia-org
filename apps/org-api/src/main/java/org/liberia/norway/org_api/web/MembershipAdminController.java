package org.liberia.norway.org_api.web;

import org.liberia.norway.org_api.model.Member;
import org.liberia.norway.org_api.repository.MemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/membership")
public class MembershipAdminController {

  private final MemberRepository repo;

  public MembershipAdminController(MemberRepository repo) { this.repo = repo; }

  @GetMapping
  public Page<MemberDTO> list(Pageable pageable) {
    return repo.findAll(pageable).map(MemberDTO::from);
  }

  @GetMapping("/{id}")
  public MemberDTO get(@PathVariable Long id) {
    return MemberDTO.from(repo.findById(id).orElseThrow());
  }

  @PostMapping
  public MemberDTO create(@RequestBody MemberDTO in) {
    Member m = new Member();
    apply(m, in);
    return MemberDTO.from(repo.save(m));
  }

  @PutMapping("/{id}")
  public MemberDTO update(@PathVariable Long id, @RequestBody MemberDTO in) {
    Member m = repo.findById(id).orElseThrow();
    apply(m, in);
    return MemberDTO.from(repo.save(m));
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) { repo.deleteById(id); }

  public record MemberDTO(
    Long id, String firstName, String lastName, String dateOfBirth,
    String personalNr, String address, String postCode, String city,
    String phone, String email, String occupation, String createdAt
  ) {
    static MemberDTO from(Member m) {
      return new MemberDTO(
        m.getId(), m.getFirstName(), m.getLastName(),
        m.getDateOfBirth() != null ? m.getDateOfBirth().toString() : null,
        m.getPersonalNr(), m.getAddress(), m.getPostCode(), m.getCity(),
        m.getPhone(), m.getEmail(), m.getOccupation(),
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
    try { return (s == null || s.isBlank()) ? null : LocalDate.parse(s); }
    catch (Exception e) { return null; }
  }
  private static String n(String s) { return (s == null || s.isBlank()) ? null : s; }
}
