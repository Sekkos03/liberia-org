package org.liberia.norway.org_api.web;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.liberia.norway.org_api.model.Advert;
import org.liberia.norway.org_api.repository.AdvertRepository;
import org.liberia.norway.org_api.web.dto.AdvertDto;
import org.liberia.norway.org_api.web.dto.AdvertMapper;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.NO_CONTENT;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

/**
 * Admin-API for annonser. Tilpasset slik at eksisterende FileStorageService kan brukes uendret.
 */
@RestController
@RequestMapping("/api/admin/adverts")
@RequiredArgsConstructor
public class AdvertAdminController {

    private final AdvertRepository repo;
    private final ApplicationContext ctx; // for å hente eksisterende FileStorageService-bean uten å avhenger av API-signatur

    // ---- LIST/GET (ADMIN) ----------------------------------------------------

    @GetMapping
    public Page<AdvertDto> list(Pageable pageable) {
        return repo.findAll(pageable).map(AdvertMapper::toDto);
    }

    @GetMapping("/{id}")
    public AdvertDto get(@PathVariable Long id) {
        Advert a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        return AdvertMapper.toDto(a);
    }

    // ---- CREATE (JSON) -------------------------------------------------------

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(CREATED)
    public AdvertDto create(@RequestBody UpsertAdvertReq req) {
        Advert a = apply(new Advert(), req);
        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    // ---- CREATE (MULTIPART) --------------------------------------------------

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(CREATED)
    @Transactional
    public AdvertDto createMultipart(
            @RequestPart("model") UpsertAdvertReq req,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws Exception {

        Advert a = apply(new Advert(), req);

        if (file != null && !file.isEmpty()) {
            var stored = tryStoreWithExternalService(file);
            if (stored != null) {
                a.setOriginalName(stored.originalName());
                a.setFileName(stored.storedName());
                a.setContentType(stored.contentType());
                a.setSizeBytes(stored.size());

                // Sett URL dersom ikke eksplisitt satt i requesten
                if (!StringUtils.hasText(a.getImageUrl()) && StringUtils.hasText(stored.publicUrl())) {
                    a.setImageUrl(stored.publicUrl());
                }
            }
        }

        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    // ---- UPDATE (JSON) -------------------------------------------------------

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AdvertDto update(@PathVariable Long id, @RequestBody UpsertAdvertReq req) {
        Advert a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        a = apply(a, req);
        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }



    // ---- UPDATE (MULTIPART) --------------------------------------------------

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public AdvertDto updateMultipart(
            @PathVariable Long id,
            @RequestPart("model") UpsertAdvertReq req,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws Exception {

        Advert a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
        a = apply(a, req);

        if (file != null && !file.isEmpty()) {
            var stored = tryStoreWithExternalService(file);
            if (stored != null) {
                a.setOriginalName(stored.originalName());
                a.setFileName(stored.storedName());
                a.setContentType(stored.contentType());
                a.setSizeBytes(stored.size());
                if (!StringUtils.hasText(a.getImageUrl()) && StringUtils.hasText(stored.publicUrl())) {
                    a.setImageUrl(stored.publicUrl());
                }
            }
        }

        a = repo.save(a);
        return AdvertMapper.toDto(a);
    }

    // ---- PUBLISH/UNPUBLISH/DELETE -------------------------------------------

    // Toggle publish: POST /api/admin/adverts/{id}/active?value=true|false
@PostMapping("/{id}/active")
@ResponseStatus(NO_CONTENT)
@Transactional
public void setActive(
        @PathVariable Long id,
        @RequestParam("value") boolean value
) {
    var advert = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
    advert.setActive(value);
    advert.setUpdatedAt(OffsetDateTime.now());
    repo.save(advert);
}

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    // ---- Intern helper: map request -> entity --------------------------------

    private Advert apply(Advert a, UpsertAdvertReq req) {
        if (req.title != null) a.setTitle(req.title);
        if (req.description != null) a.setDescription(req.description);
        if (req.targetUrl != null) a.setTargetUrl(req.targetUrl);
        if (req.placement != null) a.setPlacement(Advert.Placement.valueOf(req.placement));
        if (req.imageUrl != null) a.setImageUrl(req.imageUrl);
        if (req.slug != null && !req.slug.isBlank()) a.setSlug(req.slug);

        a.setActive(req.active != null ? req.active : a.isActive());
        a.setStartAt(req.startAt);
        a.setEndAt(req.endAt);

        a.setUpdatedAt(OffsetDateTime.now());
        return a;
    }

    public record UpsertAdvertReq(
            String slug,
            String title,
            String description,
            String targetUrl,
            String placement,   // HOME_TOP | SIDEBAR | FOOTER | INLINE
            String imageUrl,    // valgfritt (ekstern URL)
            Boolean active,
            OffsetDateTime startAt,
            OffsetDateTime endAt
    ) { }

    // ==========================================================================
    //  Lagrings-bridge: Bruk eksisterende FileStorageService uten å endre den
    // ==========================================================================

    /**
     * Prøver å finne en bean i context med navnet/klassen "FileStorageService" og kalle en av
     * metodene definert i STORE_METHOD_NAMES. Leser deretter kjente egenskaper/record-felter
     * med flere mulige navn. Faller tilbake til fornuftige defaults der det trengs.
     */
    private Stored tryStoreWithExternalService(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) return null;

        // Finn en bean som heter/er FileStorageService (uansett pakke)
        Object storageBean = findAnyFileStorageServiceBean();
        if (storageBean == null) {
            // Ingen FileStorageService bean funnet – lagre lokalt under uploads/adverts
            return storeLocally(file);
        }

        // Finn en "store"-metode med én MultipartFile-parameter
        Method storeMethod = findStoreMethod(storageBean.getClass());
        if (storeMethod == null) {
            // Tjenesten finnes, men vi fant ikke store-metoden – lagre lokalt under uploads/adverts
            return storeLocally(file);
        }

        Object result = storeMethod.invoke(storageBean, file);
        if (result == null) {
            // Lagring returnerte null – lagre lokalt under uploads/adverts
            return storeLocally(file);
        }

        // Prøv å lese verdier fra result-objektet (record/POJO/String)
        String storedName;
        String originalName;
        String contentType;
        Long size;
        String publicUrl;

        if (result instanceof String s) {
            storedName = s;
            originalName = file.getOriginalFilename();
            contentType = safe(file.getContentType());
            size = file.getSize();
            publicUrl = buildDefaultPublicUrl(storedName);
        } else {
            storedName  = readString(result, "storedName", "getStoredName", "fileName", "getFileName", "name", "getName");
            originalName = readString(result, "originalName", "getOriginalName", "original", "getOriginal");
            contentType = firstNonNull(
                    readString(result, "contentType", "getContentType", "mimeType", "getMimeType"),
                    safe(file.getContentType())
            );
            size = firstNonNull(
                    readLong(result, "size", "getSize", "sizeBytes", "getSizeBytes"),
                    file.getSize()
            );
            publicUrl = readString(result, "publicUrl", "getPublicUrl");
            if (!StringUtils.hasText(publicUrl) && StringUtils.hasText(storedName)) {
                publicUrl = buildDefaultPublicUrl(storedName);
            }
        }

        return new Stored(storedName, originalName, contentType, size, publicUrl);
    }

    private Object findAnyFileStorageServiceBean() {
        // 1) prøv navn
        String[] candidateNames = {"fileStorageService", "FileStorageService"};
        for (String name : candidateNames) {
            if (ctx.containsBean(name)) return ctx.getBean(name);
        }
        // 2) prøv type via classpath dersom klassen finnes
        try {
            Class<?> cls = Class.forName("org.liberia.norway.org_api.service.FileStorageService");
            return ctx.getBean(cls);
        } catch (Throwable ignored) { }
        try {
            Class<?> cls = Class.forName("FileStorageService");
            return ctx.getBean(cls);
        } catch (Throwable ignored) { }
        // 3) siste utvei: skann alle beans og plukk den som matcher klassenavnet
        for (String name : ctx.getBeanDefinitionNames()) {
            Object bean = ctx.getBean(name);
            if (bean.getClass().getSimpleName().equals("FileStorageService")) {
                return bean;
            }
        }
        return null;
    }

    // Vanlige metodenavn for lagring – legg gjerne til flere hvis din tjeneste bruker andre navn
    private static final List<String> STORE_METHOD_NAMES = List.of("store", "save", "saveFile", "storeFile");

    private Method findStoreMethod(Class<?> type) {
        for (String name : STORE_METHOD_NAMES) {
            try {
                return type.getMethod(name, MultipartFile.class);
            } catch (NoSuchMethodException ignore) { }
        }
        return null;
    }

    private static String readString(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                Method mm = obj.getClass().getMethod(m);
                Object v = mm.invoke(obj);
                if (v instanceof String s && StringUtils.hasText(s)) return s;
            } catch (Throwable ignore) { }
        }
        return null;
    }

    private static Long readLong(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                Method mm = obj.getClass().getMethod(m);
                Object v = mm.invoke(obj);
                if (v instanceof Long l) return l;
                if (v instanceof Number n) return n.longValue();
            } catch (Throwable ignore) { }
        }
        return null;
    }


    // ---------------------------------------------------------------------------
    //  Lokal lagring (fallback) – brukes når FileStorageService ikke finnes.
    //  Skriver fil til ./uploads/adverts og returnerer publicUrl under /uploads/adverts/<fil>
    // ---------------------------------------------------------------------------
    private Stored storeLocally(MultipartFile file) {
        try {
            String original = safe(file.getOriginalFilename());
            String ct = safe(file.getContentType());
            String ext = extensionFrom(original, ct);
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;

            Path dir = Paths.get("uploads", "adverts");
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = "/uploads/adverts/" + storedName;
            return new Stored(storedName, original, ct, file.getSize(), publicUrl);
        } catch (IOException e) {
            // Hvis vi ikke kan lagre, returner metadata uten filnavn/url
            return new Stored(null, safe(file.getOriginalFilename()), safe(file.getContentType()), file.getSize(), null);
        }
    }

    private static String extensionFrom(String originalName, String contentType) {
        // 1) prøv original filendelse
        if (StringUtils.hasText(originalName) && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase(Locale.ROOT);
            if (ext.length() <= 10) return ext;
        }
        // 2) fallback på contentType
        if (!StringUtils.hasText(contentType)) return "";
        String ct = contentType.toLowerCase(Locale.ROOT);
        if (ct.contains("jpeg")) return ".jpg";
        if (ct.contains("png")) return ".png";
        if (ct.contains("gif")) return ".gif";
        if (ct.contains("webp")) return ".webp";
        if (ct.contains("mp4")) return ".mp4";
        if (ct.contains("webm")) return ".webm";
        if (ct.contains("ogg")) return ".ogg";
        if (ct.contains("mov")) return ".mov";
        if (ct.contains("mkv")) return ".mkv";
        return "";
    }

    private static String buildDefaultPublicUrl(String storedName) {
        if (!StringUtils.hasText(storedName)) return null;
        return "/uploads/adverts/" + storedName;
    }

    private static String safe(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static <T> T firstNonNull(T a, T b) {
        return (a != null) ? a : b;
    }

    // Resultat vi bruker videre i entity
    private record Stored(String storedName, String originalName, String contentType, Long size, String publicUrl) {}

    // ---------------------------------------------------------------------------
//  Last opp/erstatt media (bilde eller video) for en annonse
//  POST /api/admin/adverts/{id}/image  (multipart/form-data)
//  Godtar både "file" og "image" som feltnavn, velger den som faktisk er lastet opp.
// ---------------------------------------------------------------------------
@PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@Transactional
public AdvertDto uploadMedia(
        @PathVariable Long id,
        @RequestPart(value = "file", required = false) MultipartFile file,
        @RequestPart(value = "image", required = false) MultipartFile image
) throws Exception {

    MultipartFile f = (file != null && !file.isEmpty()) ? file : image;
    if (f == null || f.isEmpty()) {
        throw new ResponseStatusException(BAD_REQUEST, "Mangler fil (bruk felt 'file' eller 'image').");
    }

    Advert a = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));

    var stored = tryStoreWithExternalService(f);
    if (stored != null) {
        a.setOriginalName(stored.originalName());
        a.setFileName(stored.storedName());
        a.setContentType(stored.contentType());
        a.setSizeBytes(stored.size());
        if (!StringUtils.hasText(a.getImageUrl()) && StringUtils.hasText(stored.publicUrl())) {
            a.setImageUrl(stored.publicUrl());
        }
    }

    a.setUpdatedAt(OffsetDateTime.now());
    a = repo.save(a);
    return AdvertMapper.toDto(a);
}

// ---------------------------------------------------------------------------
//  Fjern media fra annonsen (rydder feltene i databasen).
//  DELETE /api/admin/adverts/{id}/image
//  NB: Selve filen slettes ikke her (kan legges til om ønskelig).
// ---------------------------------------------------------------------------
@DeleteMapping("/{id}/image")
@ResponseStatus(NO_CONTENT)
@Transactional
public void removeMedia(@PathVariable Long id) {
    Advert a = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));
    a.setOriginalName(null);
    a.setFileName(null);
    a.setContentType(null);
    a.setSizeBytes(null);
    // Behold imageUrl hvis du lenker eksternt – eller sett til null for å rydde helt:
    a.setImageUrl(null);
    a.setUpdatedAt(OffsetDateTime.now());
    repo.save(a);
}

// imports: MediaType, MultipartFile osv. (samme som image-endepunktet ditt)
@PostMapping(path = "/{id}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@Transactional
public AdvertDto uploadVideo(
        @PathVariable Long id,
        @RequestPart(value = "file", required = false) MultipartFile file,
        @RequestPart(value = "video", required = false) MultipartFile video
) throws Exception {
    MultipartFile f = (file != null && !file.isEmpty()) ? file : video;
    if (f == null || f.isEmpty()) {
        throw new ResponseStatusException(BAD_REQUEST, "Mangler videofil (bruk 'file' eller 'video').");
    }

    var advert = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Advert not found"));

    // Gjenbruk samme lagringsrutine som for bilde
    var stored = tryStoreWithExternalService(f); // eksisterer allerede i controlleren din
    if (stored != null) {
        advert.setOriginalName(stored.originalName());
        advert.setFileName(stored.storedName());
        advert.setContentType(stored.contentType());
        advert.setSizeBytes(stored.size());
        if ((advert.getImageUrl() == null || advert.getImageUrl().isBlank())
                && stored.publicUrl() != null && !stored.publicUrl().isBlank()) {
            advert.setImageUrl(stored.publicUrl()); // brukes som mediaUrl i DTO (bilde eller video)
        }
    }

    advert.setUpdatedAt(OffsetDateTime.now());
    advert = repo.save(advert);
    return AdvertMapper.toDto(advert);
}

}
