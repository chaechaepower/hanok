package com.ssafy.be.domain.auction.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Comment {
    INTRODUCE("\uD83C\uDFA4 지금부터 상품 설명을 시작합니다!"), // 🎤 지금부터 상품 설명을 시작합니다!
    AUCTION_START("\uD83C\uDFC1 경매가 시작됐습니다!"), // 🏁 경매가 시작됐습니다!
    BID_PLACE("\uD83D\uDE80 %s님이 %d원 입찰했습니다!"), // 🚀 {닉네임} 님이 {금액}원 입찰했습니다!
    UNSOLD("😢 경매 종료! 이번 경매는 낙찰 없이 마무리되었습니다."), //😢 경매 종료! 이번 경매는 낙찰 없이 마무리되었습니다.
    SOLD(" \uD83C\uDF89 경매 종료! %s님이 %d원에 낙찰되었습니다! \uD83C\uDF89") // 🎉 경매 종료! {닉네임} 님이 {금액}원에 낙찰되었습니다! 🎉
    ;

    private final String value;
}

