package org.liberia.norway.org_api.repository;

import org.liberia.norway.org_api.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {}
