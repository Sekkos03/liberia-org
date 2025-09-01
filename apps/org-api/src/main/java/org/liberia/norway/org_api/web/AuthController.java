package org.liberia.norway.org_api.web;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authManager;
  private final TokenService tokens;

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest req) {
    Authentication auth = authManager.authenticate(
      new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
    String jwt = tokens.generateToken((UserDetails) auth.getPrincipal());
    return ResponseEntity.ok(new LoginResponse(jwt));
  }

  @Data public static class LoginRequest { private String username; private String password; }
  @Data public static class LoginResponse { private final String token; }
}
