package com.ssafy.be.global.websocket.enums;

public enum StompType {


    // 채팅
    CHAT_MESSAGE,           // 일반 채팅 메시지
    CHAT_FILTERED,          // 금칙어 감지 (개인)

    // 시스템
    SYSTEM_NOTICE,          // 공지 메시지
    SYSTEM_STREAM_START,    // 방송 시작
    SYSTEM_STREAM_END,      // 방송 종료

    // 겸매
    AUCTION_START,          // 경매 시작

    // 입찰
    BID_PLACED,             // 입찰 발생
    BID_WINNER,             // 낙찰 확정

    // 매크로
    MACRO_TEMPLATE,

    // 에러
    ERROR
}

