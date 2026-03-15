package com.ssafy.be.domain.uniqueaction.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum UniqueBidAuctionErrorCode implements ErrorCode {

    NOT_FOUND(HttpStatus.NOT_FOUND,          "UNIQUE-001", "유일 최고가 경매를 찾을 수 없습니다."),
    NOT_LIVE(HttpStatus.BAD_REQUEST,         "UNIQUE-002", "진행 중인 경매가 아닙니다."),
    ALREADY_BID(HttpStatus.CONFLICT,         "UNIQUE-003", "이미 입찰하셨습니다."),
    INVALID_AMOUNT(HttpStatus.BAD_REQUEST,   "UNIQUE-004", "유효하지 않은 입찰가입니다."),
    SELF_BID(HttpStatus.FORBIDDEN,           "UNIQUE-005", "본인 상품에 입찰할 수 없습니다."),
    UNAUTHORIZED(HttpStatus.FORBIDDEN,       "UNIQUE-006", "경매를 시작할 권한이 없습니다."),
    INVALID_SETTINGS(HttpStatus.BAD_REQUEST, "UNIQUE-007", "경매 설정값이 유효하지 않습니다."),
    INVALID_STATUS(HttpStatus.BAD_REQUEST,   "UNIQUE-008", "경매 상태가 올바르지 않습니다.");  // ← 추가

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
