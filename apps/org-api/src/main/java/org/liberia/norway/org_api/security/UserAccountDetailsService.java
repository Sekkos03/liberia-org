package org.liberia.norway.org_api.security;

import lombok.RequiredArgsConstructor;
import org.liberia.norway.org_api.model.UserAccount;
import org.liberia.norway.org_api.repository.UserAccountRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAccountDetailsService implements UserDetailsService {
  private final UserAccountRepository users;
  

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    UserAccount u = users.findByUsername(username)
      .orElseThrow(() -> new UsernameNotFoundException("Not found"));
    List<GrantedAuthority> auth = List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole()));
    return new org.springframework.security.core.userdetails.User(
      u.getUsername(), u.getPassword(), u.isEnabled(), true, true, true, auth);

      
  }
}
