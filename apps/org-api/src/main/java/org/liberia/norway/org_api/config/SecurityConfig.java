package org.liberia.norway.org_api.config;

import org.liberia.norway.org_api.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwt;

@Bean
PasswordEncoder passwordEncoder() {
  return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}
  @Bean
SecurityFilterChain security(HttpSecurity http, @Lazy JwtAuthFilter jwt) throws Exception {
      http.csrf(csrf -> csrf.disable());
      http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
      http.authorizeHttpRequests(req -> req
        .requestMatchers(
          "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
          ).permitAll()
        .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/events").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/suggestions/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/suggestions").permitAll()
        .requestMatchers(
          "/h2-console/**",
          "/actuator/**",
          "/uploads/**",
          "/api/auth/login",
          "/api/events/**",
          "/api/albums/**",
          "/api/pages/**",
          "/api/adverts/**",
          "/api/membership").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
      );
      http.headers(h -> h.frameOptions(f -> f.disable())); // H2 console
      http.addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class); 
      http.exceptionHandling(ex -> ex
  .authenticationEntryPoint((req, res, e) -> res.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED))
  .accessDeniedHandler((req, res, e) -> res.sendError(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN))
);
      return http.build();
}

 @Bean
  AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
    return cfg.getAuthenticationManager();


}
}
