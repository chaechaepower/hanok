package com.ssafy.be.global.websocket.handler;

import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;

import java.security.Principal;

public interface StreamEventHandler {

    StreamEventType getEventType();

    void handle(StompRequest<?> request, Long streamId, Principal principal);
}
