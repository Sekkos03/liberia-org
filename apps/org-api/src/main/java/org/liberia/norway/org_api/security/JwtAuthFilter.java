package org.liberia.norway.org_api.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final TokenService tokens;
  private final UserDetailsService users;

  public JwtAuthFilter(TokenService tokens, UserDetailsService users) {
    this.tokens = tokens;
    this.users = users;
  }

  @Override
protected boolean shouldNotFilter(HttpServletRequest request) {
  String p = request.getServletPath();
  return p.startsWith("/api/auth/") || p.startsWith("/h2-console");
}



  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws java.io.IOException, ServletException {

    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String jwt = header.substring(7);
      try {
        String username = tokens.extractUsername(jwt);
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
          UserDetails ud = users.loadUserByUsername(username);
          var auth = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } catch (Exception ignored) { /* invalid/expired token -> no auth set */ }
    }
    chain.doFilter(req, res);
  }
}
