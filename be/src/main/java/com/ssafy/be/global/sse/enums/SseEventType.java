package com.ssafy.be.global.sse.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SseEventType{
    CONNECT("SSE 연결"),
    NOTIFICATION("알람");

    private final String value;
}
