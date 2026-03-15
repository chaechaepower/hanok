package com.ssafy.be.domain.user.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

// 인증/회원 관련 에러코드
// global의 ErrorCode 인터페이스를 구현
// GlobalExceptionHandler가 GlobalException을 잡아서 처리하므로
// throw new GlobalException(AuthErrorCode.XXX) 형태로 사용
@Getter
@AllArgsConstructor
public enum UserErrorCode implements ErrorCode {

    // 회원가입 관련
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "USER-001", "이미 사용 중인 이메일입니다."),
    IDENTITY_VERIFICATION_FAILED(HttpStatus.BAD_REQUEST, "USER-002", "본인인증에 실패했습니다."),
    IDENTITY_VERIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "USER-003", "본인인증 정보를 찾을 수 없습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER-004", "존재하지 않는 유저입니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "USER-005", "비밀번호가 올바르지 않습니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "USER-006", "유효하지 않은 Refresh Token입니다."),
    INVALID_BANK_CODE(HttpStatus.BAD_REQUEST, "USER-007", "유효하지 않은 은행 코드입니다."),
    INSUFFICIENT_BALANCE(HttpStatus.BAD_REQUEST, "USER-008", "잔액이 부족합니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}