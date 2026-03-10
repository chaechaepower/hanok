package com.ssafy.be.domain.chat.controller;

import com.ssafy.be.domain.chat.dto.request.ChatMessageRequest;
import com.ssafy.be.domain.chat.service.ChatService;
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

        Long userId  = Long.parseLong(principal.getName());
        String nickname = (String) authentication.getDetails();

        //controller에서 전송
        chatService.handleMessage(userId, nickname, request).ifPresent(
                response -> messagingTemplate.convertAndSend(
                        "/broadcast/stream"+userId , response
                )
        );
    }
}
