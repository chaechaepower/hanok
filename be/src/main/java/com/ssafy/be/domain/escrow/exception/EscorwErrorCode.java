package com.ssafy.be.domain.escrow.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum EscorwErrorCode implements ErrorCode {

    ESCROW_NOT_FOUND(HttpStatus.NOT_FOUND, "ESCROW_001", "에스크로가 존재하지 않습니다."),
    ESCROW_NOT_SELLER(HttpStatus.FORBIDDEN, "ESCROW_002", "해당 에스크로의 판매자가 아닙니다."),
    ESCROW_NOT_BUYER(HttpStatus.FORBIDDEN, "ESCROW_003", "해당 에스크로의 구매자가 아닙니다."),
    ESCROW_INVALID_STATUS(HttpStatus.BAD_REQUEST, "ESCROW_004", "해당 작업을 수행할 수 없는 에스크로 상태입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}

