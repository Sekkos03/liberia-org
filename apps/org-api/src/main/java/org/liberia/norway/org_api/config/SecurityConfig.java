package org.liberia.norway.org_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
@EnableWebSecurity
public class SecurityConfig {
  @Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
      .requestMatchers(
  "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
).permitAll()
          .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
          .requestMatchers(HttpMethod.POST, "/api/events").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/suggestions/**").permitAll()
          .requestMatchers(HttpMethod.POST, "/api/suggestions").permitAll()
          .requestMatchers("/h2-console/**").permitAll() // dev only
          .requestMatchers("/api/admin/**").authenticated()
          .anyRequest().permitAll()
      )
      .headers(h -> h.frameOptions(f -> f.disable())) // H2 console
      .httpBasic(b -> {}); // simple basic auth for dev
    return http.build();
}
@Bean
UserDetailsService users() {
    var user = User.withUsername("admin")
                   .password("{noop}admin123") // no-op encoder for dev
                   .roles("ADMIN")
                   .build();
    return new InMemoryUserDetailsManager(user);
}


}
