package com.ssafy.be.domain.notification.controller;

import com.ssafy.be.domain.notification.controller.api.NotificationApi;
import com.ssafy.be.domain.notification.dto.response.NotificationPageResponse;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.global.common.response.ApiResponse;
import com.ssafy.be.global.sse.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import static com.ssafy.be.global.sse.enums.SseEventType.TEST;


@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController implements NotificationApi {

    private final NotificationService notificationService;
    private final SseEmitterService sseEmitterService;

    // 1. 알림 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPageResponse>> getNotifications(
            @AuthenticationPrincipal String principal,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit
    ) {
        Long userId = getUserId(principal);
        NotificationPageResponse response = notificationService.getNotifications(userId, cursor, limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // 2. 알림 읽음 처리
    @PatchMapping("/{notifId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal String principal,
            @PathVariable Long notifId
    ) {
        Long userId = getUserId(principal);
        notificationService.readNotification(userId, notifId);
        return ResponseEntity.ok().build();
    }

    // 3. 안읽은 알림 조회
    @GetMapping("/unread-count")
    public ResponseEntity<Integer> getUnreadCount(
            @AuthenticationPrincipal String principal
    ) {
        Long userId = getUserId(principal);
        int count = notificationService.getUnreadNotificationCount(userId);
        return ResponseEntity.ok(count);
    }

    // 4. 모드 읽음 처리
    @PatchMapping("/read-all")
    public ResponseEntity<java.util.Map<String, Integer>> markAllAsRead(
            @AuthenticationPrincipal String principal
    ) {
        Long userId = getUserId(principal);
        int updatedCount = notificationService.readAllNotifications(userId);

        return ResponseEntity.ok(java.util.Map.of("updatedCount", updatedCount));
    }

    // 알림 직접 전송(테스트용) TODO: 테스트 후 삭제 필요
    @GetMapping("/send")
    public void sendDirectly(@RequestParam Long receiverId) {

        sseEmitterService.sendToClient(
                TEST,
                receiverId,
                "테스트 메시지, 발송 일시= %s".format(LocalDateTime.now().toString())
        );
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }
}
