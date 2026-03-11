package com.ssafy.be.global.websocket.dto;

import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreamPublishTask<T> {
    DestType destType;
    Long streamId;
    Long userId;
    StreamEventType eventType;
    T payload;
}


