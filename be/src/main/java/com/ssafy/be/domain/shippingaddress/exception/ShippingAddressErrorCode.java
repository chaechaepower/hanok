package com.ssafy.be.domain.shippingaddress.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ShippingAddressErrorCode implements ErrorCode {

    DEFAULT_SHIPPING_ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "SHIPPING_ADDRESS_001", "기본 배송지가 존재하지 않습니다."),
    ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "SHIPPING_ADDRESS_002", "존재하지 않는 배송지입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
