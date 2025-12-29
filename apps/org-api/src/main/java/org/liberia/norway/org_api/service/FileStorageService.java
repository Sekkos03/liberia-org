package org.liberia.norway.org_api.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private final Path rootDir;
    private final String publicBasePath; // e.g. "/uploads"

    public FileStorageService(
            @Value("${app.storage.root:data/uploads}") String root,
            @Value("${app.storage.public-path:data/uploads}") String publicBasePath
    ) throws IOException {
        this.rootDir = Paths.get(root).toAbsolutePath().normalize();
        this.publicBasePath = publicBasePath.endsWith("/") ? publicBasePath.substring(0, publicBasePath.length()-1) : publicBasePath;
        Files.createDirectories(this.rootDir);
    }

    public StoredFile store(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        try {
            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
            String ext = "";
            int dot = originalName.lastIndexOf('.');
            if (dot > 0 && dot < originalName.length() - 1) {
                ext = originalName.substring(dot);
            }

            String safeBase = originalName
                    .replaceAll("[^a-zA-Z0-9._-]", "_")
                    .replaceAll("_+", "_");

            String timestamp = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String generated = UUID.randomUUID().toString().substring(0, 8);
            String storedName = stripExt(safeBase) + "_" + timestamp + "_" + generated + ext;

            Path targetDir = StringUtils.hasText(subfolder)
                    ? rootDir.resolve(subfolder).normalize()
                    : rootDir;

            Files.createDirectories(targetDir);

            Path target = targetDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String urlPath = publicBasePath
                    + (StringUtils.hasText(subfolder) ? "/" + subfolder.replace("\\", "/") : "")
                    + "/" + storedName;

            return new StoredFile(storedName, urlPath, file.getSize(), file.getContentType(), originalName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public boolean delete(String subfolder, String fileName) {
        try {
            Path p = (StringUtils.hasText(subfolder) ? rootDir.resolve(subfolder) : rootDir).resolve(fileName).normalize();
            return Files.deleteIfExists(p);
        } catch (IOException e) {
            return false;
        }
    }

    private static String stripExt(String name) {
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }

    public record StoredFile(String fileName, String url, long size, String contentType, String originalName) {}
}
