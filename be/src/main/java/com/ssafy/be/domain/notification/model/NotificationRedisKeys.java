package com.ssafy.be.domain.notification.model;

public final class NotificationRedisKeys {
    private NotificationRedisKeys() {} // 객체 생성 방지

    private static final String NOTI = "noti:";
    private static final String USER = "user:";
    private static final String INBOX = ":inbox";
    private static final String UNREAD = ":unread";

    public static String getNotiKey(Long notiId) { return NOTI + notiId; }
    public static String getUserInboxKey(Long userId) { return NOTI + USER + userId + INBOX; }
    public static String getUserUnreadKey(Long userId) { return NOTI + USER + userId + UNREAD; }
}