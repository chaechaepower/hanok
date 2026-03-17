package com.ssafy.be.global.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

import static com.ssafy.be.global.exception.GlobalErrorCode.INVALID_PARAMETER;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GlobalException.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(GlobalException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.error("[error] {}", errorCode.getMessage());

        return ResponseEntity
                .status(e.getErrorCode().getHttpStatus())
                .body(ErrorResponse.from(e.getErrorCode()));
    }

    // @Valid 실패 에러
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException e) {
        log.error("[error] {}", INVALID_PARAMETER.getMessage());

        // BindingResult에서 필드별 에러 메시지를 Map으로 수집
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.from(INVALID_PARAMETER, errors));
    }
}
