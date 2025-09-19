// SuggestionResponse.java
package org.liberia.norway.org_api.web.dto;

import java.time.OffsetDateTime;

public record SuggestionResponse(
    Long id, String name, String email, String message, String status, OffsetDateTime createdAt
) {}
