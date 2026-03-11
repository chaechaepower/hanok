package com.ssafy.be.global.websocket.controller;

import com.ssafy.be.global.websocket.dto.request.StompRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@RequiredArgsConstructor
@Controller
public class StreamSocketController {
    private final StreamEventDispatcher dispatcher;

    @MessageMapping("/streams/{streamId}")
    public void handleMeetingEvent(StompRequest<?> request, @DestinationVariable Long streamId, Principal principal) {
        dispatcher.dispatch(request, streamId, principal);
    }
}

