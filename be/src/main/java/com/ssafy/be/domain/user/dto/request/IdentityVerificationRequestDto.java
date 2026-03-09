package com.ssafy.be.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record IdentityVerificationRequestDto(
        @NotBlank()
        String identityVerificationId
) {}