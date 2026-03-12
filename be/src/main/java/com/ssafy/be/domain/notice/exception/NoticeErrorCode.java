package com.ssafy.be.domain.notice.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum NoticeErrorCode implements ErrorCode {

    NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "Notice-001", "공지사항을 찾을 수 없습니다."),
    UNAUTHORIZED_NOTICE_ACCESS(HttpStatus.FORBIDDEN, "Notice-002", "해당 판매자의 공지사항이 아닙니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}