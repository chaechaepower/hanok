package com.ssafy.be.global.sse.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SseEventType{
    CONNECT("SSE 연결"),
    NOTIFICATION("알람"),
    TEST("테스트용");

    private final String value;
}
