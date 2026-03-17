package com.ssafy.be.domain.chat.handler;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.CHAT_MESSAGE;

@RequiredArgsConstructor
@Component
public class ChatMessageHandler implements StreamEventHandler {
    private final ChatService chatService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return CHAT_MESSAGE;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        UsernamePasswordAuthenticationToken authentication =
                (UsernamePasswordAuthenticationToken) principal;

        Long userId = Long.parseLong(principal.getName());
        String nickname = (String) authentication.getDetails();

        ChatMessageRequest requestPayload = jsonConverter.convert(request.getPayload(), ChatMessageRequest.class);

        ChatMessagePayload responsePayload = chatService.handleMessage(userId, nickname, streamId, requestPayload);  // streamId 넘김

        streamPublisher.broadcast(streamId, CHAT_MESSAGE, responsePayload);
    }



}