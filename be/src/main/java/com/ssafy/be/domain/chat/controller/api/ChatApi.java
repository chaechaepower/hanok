package com.ssafy.be.domain.chat.controller.api;

import com.ssafy.be.domain.chat.dto.payload.ChatMessagePayload;
import com.ssafy.be.global.common.response.ApiResponse;
import com.ssafy.be.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface ChatApi {

    @Operation(summary = "채팅 히스토리 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", description = "조회 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", description = "채팅 내역 없음",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    ResponseEntity<ApiResponse<List<ChatMessagePayload>>> getChatHistory(Long streamId);

    @Operation(summary = "채팅 캐시 삭제 (방송 종료)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", description = "삭제 성공")
    ResponseEntity<ApiResponse<Void>> clearChat(Long streamId);

    @Operation(summary = "매크로 목록 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", description = "조회 성공")
    ResponseEntity<ApiResponse<List<?>>> getMacros();
}
