package org.liberia.norway.org_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:5173","http://localhost:3000", "https://liberia-org-admin.vercel.app" , "https://liberia-org-public.vercel.app/", "https://liberia-org.onrender.com" )
                        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS");
            }
        };
    }
}
