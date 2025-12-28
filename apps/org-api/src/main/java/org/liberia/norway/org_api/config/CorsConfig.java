package org.liberia.norway.org_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                        "http://localhost:3000",
                        "https://liberia-org-admin.vercel.app",
                        "https://liberia-org-public.vercel.app"
                )
                .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        // Hvis du også server images via /uploads/** (ofte nødvendig)
        registry.addMapping("/uploads/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                        "http://localhost:3000",
                        "https://liberia-org-admin.vercel.app",
                        "https://liberia-org-public.vercel.app"
                )
                .allowedMethods("GET","OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
