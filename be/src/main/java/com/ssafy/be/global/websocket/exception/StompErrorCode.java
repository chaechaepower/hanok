package com.ssafy.be.global.websocket.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum StompErrorCode {

    INVALID_PAYLOAD("STOMP-001", "유효하지 않은 메시지 형식입니다."),
    UNAUTHORIZED("STOMP-002", "인증되지 않은 사용자입니다."),
    STREAM_NOT_FOUND("STOMP-003", "존재하지 않는 스트림입니다."),
    INTERNAL_ERROR("STOMP-004", "모르는 에러입니다.");

    private final String code;
    private final String message;
}