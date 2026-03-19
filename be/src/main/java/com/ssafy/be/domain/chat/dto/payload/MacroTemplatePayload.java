package com.ssafy.be.domain.chat.dto.payload;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record MacroTemplatePayload(
        String questionType,
        String answer,
        String sender,
        LocalDateTime createdAt
) {}

