package com.ssafy.be.global.websocket.controller;

import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.exception.StompException;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class StreamEventDispatcher {
    private final Map<StreamEventType, StreamEventHandler> handlerMap;

    public StreamEventDispatcher(List<StreamEventHandler> handlerList) {
        this.handlerMap = handlerList.stream()
                .collect(Collectors.toMap(StreamEventHandler::getEventType, handler -> handler));
    }

    public void dispatch(StompRequest<?> request, Long streamId, Principal principal) {
        StreamEventHandler meetingEventHandler = handlerMap.get(request.getEventType());

        if (meetingEventHandler == null) {
            throw new StompException(StreamErrorCode.INVALID_STREAM_EVENT_TYPE);
        }

        meetingEventHandler.handle(request, streamId, principal);
    }
}