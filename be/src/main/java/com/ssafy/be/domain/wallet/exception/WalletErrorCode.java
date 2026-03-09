package com.ssafy.be.domain.wallet.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum WalletErrorCode implements ErrorCode {

    WALLET_CHARGE_AMOUNT_TOO_LOW(HttpStatus.BAD_REQUEST, "WALLET_001", "최소 충전 금액 미만입니다."),
    WALLET_CHARGE_NOT_FOUND(HttpStatus.NOT_FOUND, "WALLET_002", "가상머니 충전 내역이 존재하지 않습니다."),
    WALLET_CHARGE_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "WALLET_003", "결제 금액이 일치하지 않습니다."),
    WALLET_CHARGE_UNAUTHORIZED(HttpStatus.FORBIDDEN, "WALLET_004", "해당 결제에 대한 권한이 없습니다."),
    WALLET_INSUFFICIENT_BALANCE(HttpStatus.BAD_REQUEST, "WALLET_005", "잔액이 부족합니다."),
    WALLET_WITHDRAW_AMOUNT_TOO_LOW(HttpStatus.BAD_REQUEST, "WALLET_006", "최소 출금 금액 미만입니다."),
    WALLET_WITHDRAW_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "WALLET_007", "가상머니 출금 요청이 없습니다."),
    WALLET_WITHDRAW_ALREADY_PROCESSED(HttpStatus.CONFLICT, "WALLET_008", "이미 처리된 출금 요청입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}

