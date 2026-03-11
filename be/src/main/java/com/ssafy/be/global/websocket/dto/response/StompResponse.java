package com.ssafy.be.global.websocket.dto.response;

import com.ssafy.be.global.websocket.enums.StreamEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StompResponse<T> {

    private StreamEventType eventType;
    private T payload;

}
