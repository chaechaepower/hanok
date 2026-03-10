package com.ssafy.be.domain.chat.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ChatErrorCode implements ErrorCode {
    CHAT_SERIALIZATION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CHAT-001", "채팅 데이터를 변환하는 중 오류가 발생했습니다."),
    CHAT_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT-002", "채팅 내역이 존재하지 않습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
