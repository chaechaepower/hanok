package com.ssafy.be.domain.stream.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum StreamErrorCode implements ErrorCode {
    STREAM_NOT_FOUND(HttpStatus.NOT_FOUND, "STREAM_001", "스트림을 찾을 수 없습니다."),
    THUMBNAIL_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "STREAM_002", "썸네일 업로드에 실패했습니다."),
    INVALID_STREAM_EVENT_TYPE(HttpStatus.NOT_FOUND, "STREAM_003", "존재하지 않는 스트림 이벤트 타입입니다."),
    STREAM_NOT_LIVE(HttpStatus.BAD_REQUEST, "STREAM_004", "라이브 상태의 스트림이 아닙니다."),
    STREAM_CANNOT_DELETE(HttpStatus.BAD_REQUEST, "STREAM_005", "예약 상태의 방송만 삭제할 수 있습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
