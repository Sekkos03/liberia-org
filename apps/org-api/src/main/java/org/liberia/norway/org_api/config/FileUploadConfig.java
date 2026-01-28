package org.liberia.norway.org_api.config;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.MultipartConfigElement;

/**
 * Configuration for handling large file uploads (especially videos).
 * 
 * This configuration allows:
 * - Individual files up to 500MB (for large videos)
 * - Total request size up to 2GB (for multiple file uploads)
 * - Files larger than 10MB are written to disk to prevent memory issues
 */
@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    /**
     * Configure multipart file upload settings.
     * These settings override the default Spring Boot limits.
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        
        // Maximum size for individual uploaded files (500MB for videos)
        factory.setMaxFileSize(DataSize.ofMegabytes(500));
        
        // Maximum size for the entire request (2GB for multiple files)
        factory.setMaxRequestSize(DataSize.ofGigabytes(2));
        
        // Files larger than 10MB will be written to disk instead of kept in memory
        factory.setFileSizeThreshold(DataSize.ofMegabytes(10));
        
        return factory.createMultipartConfig();
    }

    /**
     * Use the standard servlet multipart resolver.
     */
    @Bean
    public MultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }
}
