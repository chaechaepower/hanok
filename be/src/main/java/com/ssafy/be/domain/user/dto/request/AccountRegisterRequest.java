package com.ssafy.be.domain.user.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AccountRegisterRequest(
        @NotBlank String bankCode,
        @NotBlank String accountName,
        @NotBlank String accountNum
) {}
