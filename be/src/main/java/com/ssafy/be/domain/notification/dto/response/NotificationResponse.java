package com.ssafy.be.domain.notification.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Builder
public record NotificationResponse(
        Long id,
        String type,
        String title,
        String body,
        Boolean isRead,
        LocalDateTime createdAt,
        Map<String, Object> routingField
) {
}
