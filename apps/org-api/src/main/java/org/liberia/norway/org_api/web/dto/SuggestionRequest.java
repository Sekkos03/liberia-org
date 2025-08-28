package org.liberia.norway.org_api.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SuggestionRequest(
        @Size(max = 200) String name,
        @Email @Size(max = 320) String email,
        @NotBlank String message
) {}
