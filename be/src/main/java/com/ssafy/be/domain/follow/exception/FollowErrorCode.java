package com.ssafy.be.domain.follow.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum FollowErrorCode implements ErrorCode {

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "FOLLOW-001", "사용자를 찾을 수 없습니다."),
    SELLER_NOT_FOUND(HttpStatus.NOT_FOUND, "FOLLOW-002", "팔로우 대상이 판매자가 아닙니다."),
    SELF_FOLLOW_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "FOLLOW-003", "자기 자신은 팔로우할 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
