package com.ssafy.be.domain.chat.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum MacroErrorCode implements ErrorCode {
    MACRO_NOT_FOUND(HttpStatus.NOT_FOUND, "MACRO-001", "등록된 매크로 답변이 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
