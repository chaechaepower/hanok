package com.ssafy.be.global.websocket.exception;

import com.ssafy.be.global.exception.ErrorCode;
import com.ssafy.be.global.exception.GlobalErrorCode;
import com.ssafy.be.global.websocket.dto.response.StompErrorPayload;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.nio.file.AccessDeniedException;

@Slf4j
@ControllerAdvice
@RequiredArgsConstructor
public class StompExceptionHandler {

    // @Valid 검증 실패
    @MessageExceptionHandler(MethodArgumentNotValidException.class)
    @SendToUser("/private/errors")
    public StompResponse<StompErrorPayload> handleValidation(MethodArgumentNotValidException ex) {
        return buildErrorResponse(GlobalErrorCode.INVALID_PARAMETER);
    }

    // 인증 실패
    @MessageExceptionHandler(AccessDeniedException.class)
    @SendToUser("/private/errors")
    public StompResponse<StompErrorPayload> handleAccessDenied(AccessDeniedException ex) {
        return buildErrorResponse(GlobalErrorCode.UNAUTHORIZED);
    }

    // 비즈니스 예외 (StompException)
    @MessageExceptionHandler(StompException.class)
    @SendToUser("/private/errors")
    public StompResponse<StompErrorPayload> handleWebSocketException(StompException ex) {
        return buildErrorResponse(ex.getErrorType());
    }

    // 나머지
    @MessageExceptionHandler(Exception.class)
    @SendToUser("/private/errors")
    public StompResponse<StompErrorPayload> handleException(Exception ex) {
        log.error("[STOMP] 처리되지 않은 예외 발생", ex);
        return buildErrorResponse(GlobalErrorCode.INTERNAL_SERVER_ERROR);
    }

    // response 빌드
    private StompResponse<StompErrorPayload> buildErrorResponse(ErrorCode errorCode) {
        return StompResponse.<StompErrorPayload>builder()
                .eventType(StreamEventType.ERROR)
                .payload(buildErrorPayload(errorCode))
                .build();
    }

    // payload 빌드
    private StompErrorPayload buildErrorPayload(ErrorCode errorCode) {
        return StompErrorPayload.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
    }
}

