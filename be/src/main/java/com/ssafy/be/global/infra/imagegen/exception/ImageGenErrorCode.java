package com.ssafy.be.global.infra.imagegen.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ImageGenErrorCode implements ErrorCode {

    IMAGE_GENERATION_FAILED(HttpStatus.BAD_GATEWAY, "AI_IMG_001", "AI 이미지를 생성하지 못했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
