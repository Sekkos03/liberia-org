package org.liberia.norway.org_api.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

  private final String uploadRoot;

  public UploadResourceConfig(@Value("${app.storage.root:uploads}") String uploadRoot) {
    this.uploadRoot = uploadRoot;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path root = Paths.get(uploadRoot).toAbsolutePath().normalize();

    // Viktig: "file:" + ... + "/" (slash på slutten)
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations("file:" + root.toString() + "/");
  }
}
