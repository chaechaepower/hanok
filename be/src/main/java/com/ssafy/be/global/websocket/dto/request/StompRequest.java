package com.ssafy.be.global.websocket.dto.request;

import com.ssafy.be.global.websocket.enums.StompType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StompRequest<T> {

    private StompType eventType;
    private T payload;

}
