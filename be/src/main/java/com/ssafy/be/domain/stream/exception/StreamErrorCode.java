package com.ssafy.be.domain.stream.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum StreamErrorCode implements ErrorCode {
    STREAM_NOT_FOUND(HttpStatus.NOT_FOUND, "Stream-001", "방송을 찾을 수 없습니다."),
    THUMBNAIL_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Stream-002", "썸네일 업로드에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}