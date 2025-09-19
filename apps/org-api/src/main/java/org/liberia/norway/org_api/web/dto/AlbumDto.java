package org.liberia.norway.org_api.web.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumDto {
    private Long id;
    private String title;
    private String slug;
    private String coverUrl;   // bilde som vises som cover (hentes fra første/siste item)
    private int itemsCount;
}
