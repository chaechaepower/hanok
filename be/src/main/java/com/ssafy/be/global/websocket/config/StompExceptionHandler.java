package com.ssafy.be.global.websocket.config;

import com.ssafy.be.global.websocket.dto.response.StompErrorPayload;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StompType;
import com.ssafy.be.global.websocket.exception.StompErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.nio.file.AccessDeniedException;

@ControllerAdvice
@RequiredArgsConstructor
public class StompExceptionHandler {


    // @Valid 검증 실패
    @MessageExceptionHandler(MethodArgumentNotValidException.class)
    @SendToUser("/private/errors")
    public StompResponse<?> handleValidation(MethodArgumentNotValidException ex) {
        return buildErrorResponse(StompErrorCode.INVALID_PAYLOAD);
    }


    // 인증 실패
    @MessageExceptionHandler(AccessDeniedException.class)
    @SendToUser("/private/errors")
    public StompResponse<?> handleAccessDenied(AccessDeniedException ex) {
        return buildErrorResponse(StompErrorCode.UNAUTHORIZED);
    }

    // 나머지
    @MessageExceptionHandler(Exception.class)
    @SendToUser("/private/errors")
    public StompResponse<?> handleException(Exception ex) {
        return buildErrorResponse(StompErrorCode.INTERNAL_ERROR);
    }

    // response 빌드
    private StompResponse<StompErrorPayload> buildErrorResponse(StompErrorCode errorCode) {
        return StompResponse.<StompErrorPayload>builder()
                .eventType(StompType.ERROR)
                .payload(buildErrorPayload(errorCode))
                .build();
    }

    // payload 빌드
    private StompErrorPayload buildErrorPayload(StompErrorCode errorCode) {
        return StompErrorPayload.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
    }
}

