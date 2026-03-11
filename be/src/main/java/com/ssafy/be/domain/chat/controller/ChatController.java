package com.ssafy.be.domain.chat.controller;


import com.ssafy.be.domain.chat.controller.api.ChatApi;
import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.domain.chat.service.ChatService;
import com.ssafy.be.global.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/")
@RequiredArgsConstructor
public class ChatController implements ChatApi {

    private final ChatService chatService;

    @Override
    @GetMapping("/streams/{streamId}/chat")
    public ResponseEntity<ApiResponse<List<ChatMessagePayload>>> getChatHistory(
            @PathVariable Long streamId
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getRecentMessage(streamId)));
    }

    @Override
    @DeleteMapping("/streams/{streamId}/chat")
    public ResponseEntity<ApiResponse<Void>> clearChat(
            @PathVariable Long streamId
    ) {
        chatService.deleteChat(streamId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @Override
    @GetMapping("/macros")
    public ResponseEntity<ApiResponse<List<?>>> getMacros() {
        return ResponseEntity.ok(ApiResponse.success(List.of()));
    }
}
