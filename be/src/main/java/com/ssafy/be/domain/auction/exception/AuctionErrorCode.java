package com.ssafy.be.domain.auction.exception;

import com.ssafy.be.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum AuctionErrorCode implements ErrorCode {

    AUCTION_NOT_FOUND(HttpStatus.NOT_FOUND, "AUCTION_001", "해당 경매가 존재하지 않습니다."),
    AUCTION_UNAUTHORIZED(HttpStatus.FORBIDDEN, "AUCTION_002", "해당 경매 기능에 대한 권한이 없습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}

