package com.ssafy.be.global.exception;

import lombok.Getter;

@Getter
public class ErrorResponse {


    private final String code;
    private final String message;

    //new 방지위한 private 생성자
    private ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public static ErrorResponse error(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage());
    }
}
