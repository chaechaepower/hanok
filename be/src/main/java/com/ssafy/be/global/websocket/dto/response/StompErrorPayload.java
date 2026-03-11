package com.ssafy.be.global.websocket.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StompErrorPayload {
    private final String code;
    private final String message;
}