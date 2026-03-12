package com.ssafy.be.global.websocket.enums;

public enum StreamEventType {


    // 채팅
    CHAT_MESSAGE,           // 일반 채팅 메시지
    CHAT_FILTERED,          // 금칙어 감지 (개인)

    // 시스템
    SYSTEM_NOTICE,          // 공지 메시지
    SYSTEM_STREAM_START,    // 방송 시작
    SYSTEM_STREAM_END,      // 방송 종료

    // 겸매
    AUCTION_START,          // 경매 시작
    AUCTION_END,            // 경매 종료
    AUCTION_STATISTICS,     // 경매 실시간 통계
    ITEM_SYNC,              // 경매 물품 정보 동기화
    ITEM_INTRODUCE,         // 경매 물품 설명 시작

    // 입찰
    BID_PLACED,             // 입찰 발생
    BID_WINNER,             // 낙찰 확정
    BID_SYNC,               // 경매 입찰 정보 동기화

    // 매크로
    MACRO_TEMPLATE,

    // 에러
    ERROR
}

