package com.ssafy.be.domain.chat.controller;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/stream/{streamId}")
    public void handleChatMessage(
            @DestinationVariable Long streamId,
            @Payload @Valid ChatMessageRequest request,
            Principal principal
    ) {
        UsernamePasswordAuthenticationToken authentication =
                (UsernamePasswordAuthenticationToken) principal;

        Long userId = Long.parseLong(principal.getName());
        String nickname = (String) authentication.getDetails();

        // 1. Service로부터 마스킹 처리가 완료된 통합 응답 객체
        StompResponse<ChatMessagePayload> response = chatService.handleMessage(userId, nickname, request);

        // 2. 해당 방의 모든 구독자에게 일괄 브로드캐스트
        messagingTemplate.convertAndSend("/broadcast/stream/" + streamId, response);
    }
}