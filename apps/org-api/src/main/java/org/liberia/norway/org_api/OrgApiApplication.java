
package org.liberia.norway.org_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@SpringBootApplication
@EntityScan(basePackages = "org.liberia.norway.org_api.model")
@EnableJpaRepositories(basePackages = "org.liberia.norway.org_api.repository")
public class OrgApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrgApiApplication.class, args);
    }
     @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
                .addModule(new JavaTimeModule()) // support for OffsetDateTime, LocalDateTime, etc.
                .build();
    }
}
