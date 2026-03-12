package com.ssafy.be.domain.seller.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum SellerErrorCode implements ErrorCode {

    SELLER_ALREADY_EXISTS(HttpStatus.CONFLICT, "Seller-001", "이미 판매자로 등록된 사용자입니다."),
    SELLER_NOT_FOUND(HttpStatus.NOT_FOUND, "Seller-002", "판매자 정보를 찾을 수 없습니다."),
    SELLER_FORBIDDEN(HttpStatus.FORBIDDEN, "Seller-003", "본인의 상점만 수정할 수 있습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}