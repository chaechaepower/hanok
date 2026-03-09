package com.ssafy.be.domain.notification.model;

import lombok.Builder;

import java.time.LocalDateTime;


@Builder(toBuilder = true)
public record Notification (
        Long id,
        Long userId,
        String type,
        String title,
        String body,
        Boolean isRead,
        LocalDateTime createdAt,
        String actionUrl
)
{
}

