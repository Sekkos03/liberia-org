package org.liberia.norway.org_api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

  @Value("${storage.upload-dir:uploads}")
  private String uploadDir;

  public String store(MultipartFile file, String subfolder) throws IOException {
    String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
    String filename = UUID.randomUUID() + (ext != null ? "." + ext.toLowerCase() : "");
    Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
    Path folder = root.resolve(subfolder).normalize();
    Files.createDirectories(folder);
    Path target = folder.resolve(filename);
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    return "/uploads/" + subfolder + "/" + filename;
  }
}
