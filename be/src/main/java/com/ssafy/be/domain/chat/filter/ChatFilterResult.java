package com.ssafy.be.domain.chat.filter;

import lombok.Builder;

@Builder
public record ChatFilterResult(
        boolean isDetected,
        String maskedText
) {}