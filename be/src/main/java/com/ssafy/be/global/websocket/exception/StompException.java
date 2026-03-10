package com.ssafy.be.global.websocket.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StompException extends RuntimeException {
    private final ErrorCode errorType;
}
