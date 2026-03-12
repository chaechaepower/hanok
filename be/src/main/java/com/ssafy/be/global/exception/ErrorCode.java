package com.ssafy.be.global.exception;

import org.springframework.http.HttpStatus;

import java.io.Serializable;

//기존의 enum은 직렬화가 가능하지만 소나큐브는 인터페이스만 보기 때문에 명시 추천
public interface ErrorCode extends Serializable {
    HttpStatus getHttpStatus();
    String getCode();
    String getMessage();
}
