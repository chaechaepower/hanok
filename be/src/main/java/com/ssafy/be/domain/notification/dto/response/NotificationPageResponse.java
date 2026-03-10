package com.ssafy.be.domain.notification.dto.response;

import java.util.List;

public record NotificationPageResponse(
        List<NotificationResponse> items,
        Integer unreadCount,
        Boolean hasNext,
        String nextCursor
) {
}
