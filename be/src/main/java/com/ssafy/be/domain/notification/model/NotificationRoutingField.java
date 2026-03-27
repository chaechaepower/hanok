package com.ssafy.be.domain.notification.model;

import java.util.Map;

/**
 * 알림 라우팅용 필드(JSON 직렬화 전). type별로 프론트가 필요로 하는 키만 조합한다.
 */
public final class NotificationRoutingField {

    private NotificationRoutingField() {
    }

    public static Map<String, Object> escrow(long escrowId) {
        return Map.of("escrowId", escrowId);
    }

    public static Map<String, Object> notice(long sellerId, long noticeId) {
        return Map.of(
                "sellerId", sellerId,
                "noticeId", noticeId
        );
    }

    public static Map<String, Object> stream(long streamId) {
        return Map.of("streamId", streamId);
    }
}
