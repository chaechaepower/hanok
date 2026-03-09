package com.ssafy.be.domain.notification.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum NotificationErrorCode implements ErrorCode {

    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTI-001", "존재하지 않거나 이미 만료된 알림입니다."),
    UNAUTHORIZED_READ(HttpStatus.FORBIDDEN, "NOTI-002", "본인의 알림만 읽음 처리할 수 있습니다."),
    REDIS_SERIALIZATION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "NOTI-003", "알림 데이터를 변환하는 중 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
