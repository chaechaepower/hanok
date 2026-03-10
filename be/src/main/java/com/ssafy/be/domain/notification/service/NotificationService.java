package com.ssafy.be.domain.notification.service;

import com.ssafy.be.domain.notification.dto.response.NotificationPageResponse;
import com.ssafy.be.domain.notification.dto.response.NotificationResponse;
import com.ssafy.be.domain.notification.exception.NotificationErrorCode;
import com.ssafy.be.domain.notification.model.Notification;
import com.ssafy.be.domain.notification.repository.NotificationRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // 알림 목록 페이징
    public NotificationPageResponse getNotifications(Long userId, String cursor, int limit) {

        // 1. curser = null 처음부터, 아니면 cursor 다음부터
        List<Notification> notifications = notificationRepository.findInboxByUserIdWithCurSor(userId, cursor, limit + 1);
        boolean hasNext = notifications.size() > limit;
        String nextCursor = null;

        // 2. hasNext = limit+1로 next확인해서 -1 -> 확인된 다음 메모는 삭제하고 해당 갯수 반환
        if (hasNext) {
            Notification lastNotification = notifications.get(limit-1);
            nextCursor = String.valueOf(lastNotification.id());
            notifications.remove(limit);
        }

        List<NotificationResponse> items = convertToDtoList(notifications);
        int unreadCount = notificationRepository.getUnreadCount(userId);

        return new NotificationPageResponse(items, unreadCount, hasNext, nextCursor);
    }

    //단일 알림 조회
    public void readNotification(Long userId, Long notifId) {
        Notification noti = notificationRepository.findById(notifId);

        // 1. 알림이 존재하지 않거나, 이미 TTL로 날아간 경우
        if (noti == null) {
            throw new GlobalException(NotificationErrorCode.NOTIFICATION_NOT_FOUND);
        }

        // 2. 요청 방어
        if (!noti.userId().equals(userId)) {
            throw new GlobalException(NotificationErrorCode.UNAUTHORIZED_READ);
        }

        notificationRepository.markAsRead(userId, notifId);
    }

    // 안 읽은 알림 배지 개수 조회
    public int getUnreadNotificationCount(Long userId) {
        return notificationRepository.getUnreadCount(userId);
    }

    // 모두 읽음 처리
    public int readAllNotifications(Long userId) {
        // 읽지 않은 개수를 먼저 파악 (응답용)
        int unreadCount = notificationRepository.getUnreadCount(userId);
        if (unreadCount == 0) return 0;

        // Repository를 시켜서 한 방에 업데이트!
        notificationRepository.markAllAsRead(userId);
        return unreadCount;
    }

    // 테스트용 발송
    public void sendNotification(Long userId, String type, String title, String body, String actionUrl) {
        // 하단의 private 메서드를 호출해 도메인 객체(record)를 생성
        Notification newNoti = createNewNotification(userId, type, title, body, actionUrl);

        // Repository를 통해 Redis에 저장 (Hash, ZSet, String 카운트 증가 + TTL/Capping 적용)
        notificationRepository.save(newNoti);
    }

    // 전체 시스템 알림 (예비)
//    public void sendNotification(Long userId, String type, String title, String body, String actionUrl) {
//        Notification newNoti = createNewNotification(userId, type, title, body, actionUrl);
//        notificationRepository.save(newNoti);
//    }


    // Private --------------------------------------------------------------


    private List<NotificationResponse> convertToDtoList(List<Notification> notifications) {
        return notifications.stream()
                .map(this::from)
                .collect(Collectors.toList());
    }

    private Notification createNewNotification(Long userId, String type, String title, String body, String actionUrl) {
        Long generatedId = System.currentTimeMillis();

        return Notification.builder()
                .id(generatedId)
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .actionUrl(actionUrl)
                .build();
    }

    private NotificationResponse from(Notification noti) {
        return NotificationResponse.builder()
                .id(noti.id())
                .type(noti.type())
                .title(noti.title())
                .body(noti.body())
                .isRead(noti.isRead())
                .createdAt(noti.createdAt())
                .actionUrl(noti.actionUrl())
                .build();
    }

}
