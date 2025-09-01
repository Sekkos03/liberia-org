package org.liberia.norway.org_api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

@Service
public class TokenService {

    private final String secret;
    private final long expMinutes;

    public TokenService(
            @Value("${app.jwt.secret:dev-secret-change-me}") String secret,
            @Value("${app.jwt.exp-minutes:240}") long expMinutes
    ) {
        this.secret = secret;
        this.expMinutes = expMinutes;
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /* -------------------- CREATE -------------------- */

    public String generateToken(UserDetails user) {
        return generateToken(user.getUsername(), Map.of());
    }

    public String generateToken(String subject, Map<String, Object> extraClaims) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime exp = now.plusMinutes(expMinutes);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(Date.from(now.toInstant()))
                .expiration(Date.from(exp.toInstant()))
                .signWith(signingKey())
                .compact();
    }

    /* -------------------- READ / VALIDATE -------------------- */

    // Alias to match code that calls extractUsername(token)
    public String extractUsername(String token) {
        return getUsername(token);
    }

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public OffsetDateTime getExpiration(String token) {
        Date exp = parseClaims(token).getExpiration();
        return exp == null ? null : exp.toInstant().atOffset(ZoneOffset.UTC);
    }

    public boolean isExpired(String token) {
        OffsetDateTime exp = getExpiration(token);
        return exp == null || exp.isBefore(OffsetDateTime.now(ZoneOffset.UTC));
    }

    /** Basic validation: signature OK and not expired */
    public boolean isValid(String token) {
        try {
            return !isExpired(token); // parseClaims() also verifies signature
        } catch (Exception e) {
            return false;
        }
    }

    /** Common overload some projects use (username match + not expired) */
    public boolean isValid(String token, UserDetails user) {
        try {
            String username = getUsername(token);
            return username != null && username.equals(user.getUsername()) && !isExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    /** Generic claim extractor (useful if your code calls extractClaim) */
    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseClaims(token));
    }

    /* -------------------- INTERNAL -------------------- */

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(stripBearer(token))
                .getPayload();
    }

    private static String stripBearer(String token) {
        if (token == null) return "";
        String t = token.trim();
        return t.regionMatches(true, 0, "Bearer ", 0, 7) ? t.substring(7).trim() : t;
    }
}
