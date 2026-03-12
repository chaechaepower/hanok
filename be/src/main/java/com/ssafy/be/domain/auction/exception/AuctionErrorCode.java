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
    AUCTION_NOT_LIVE(HttpStatus.BAD_REQUEST, "AUCTION_003", "현재 진행 중인 라이브 경매가 아닙니다."),
    AUCTION_SELF_BID_NOT_ALLOWED(HttpStatus.FORBIDDEN, "AUCTION_004", "본인 물건에는 입찰할 수 없습니다."),
    AUCTION_BID_INSUFFICIENT_BALANCE(HttpStatus.BAD_REQUEST, "AUCTION_005", "입찰에 필요한 잔액이 부족합니다."),
    AUCTION_BID_TOO_LOW(HttpStatus.BAD_REQUEST, "AUCTION_006", "입찰가가 현재 최고가보다 높아야 합니다."),
    AUCTION_BID_BELOW_START_PRICE(HttpStatus.BAD_REQUEST, "AUCTION_007", "입찰가가 시작가보다 높아야 합니다."),
    AUCTION_BID_CONFLICT(HttpStatus.CONFLICT, "AUCTION_08", "다른 사용자가 먼저 입찰했습니다. 다시 시도해주세요."),
    LIVE_AUCTION_NOT_FOUND(HttpStatus.NOT_FOUND, "AUCTION_09", "현재 경매중인 물품이 없습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}

