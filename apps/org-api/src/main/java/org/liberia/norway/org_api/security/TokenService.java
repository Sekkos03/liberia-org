package org.liberia.norway.org_api.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

@Service
public class TokenService {

  private final SecretKey key;
  private final long ttlMillis;

  public TokenService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.ttl-minutes:120}") long ttlMinutes) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes());
    this.ttlMillis = ttlMinutes * 60_000L;
  }

  public String generate(UserDetails user) {
    Instant now = Instant.now();
    return Jwts.builder()
      .subject(user.getUsername())
      .issuedAt(Date.from(now))
      .expiration(Date.from(now.plusMillis(ttlMillis)))
      .signWith(key)
      .compact();
  }

  public String extractUsername(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token)
      .getPayload().getSubject();
  }
}
