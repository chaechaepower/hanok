package com.ssafy.be.domain.search.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum SearchErrorCode implements ErrorCode {

    KEYWORD_TOO_SHORT(HttpStatus.BAD_REQUEST, "SEARCH_001", "검색어는 2자 이상 입력해주세요."),
    KEYWORD_TOO_LONG(HttpStatus.BAD_REQUEST, "SEARCH_002", "검색어는 50자 이하로 입력해주세요."),
    KEYWORD_BLANK(HttpStatus.BAD_REQUEST, "SEARCH_003", "검색어를 입력해주세요."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
