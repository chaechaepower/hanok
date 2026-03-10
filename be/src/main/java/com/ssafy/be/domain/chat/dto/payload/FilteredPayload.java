package com.ssafy.be.domain.chat.dto.payload;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record FilteredPayload(
        String reason,
        LocalDateTime detectedAt
) {}
