package org.liberia.norway.org_api.web;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.MembershipApplication;
import org.liberia.norway.org_api.repository.MembershipApplicationRepository;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class MembershipController {
  private final MembershipApplicationRepository repo;

  @PostMapping("/api/membership")
  public MembershipApplication submit(@RequestBody MembershipApplication m){
    m.setId(null); m.setCreatedAt(OffsetDateTime.now());
    return repo.save(m);
  }

  @GetMapping("/api/admin/memberships")
  public List<MembershipApplication> list(){
    return repo.findAll();
  }
}
