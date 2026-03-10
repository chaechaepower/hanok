package com.ssafy.be.domain.notification.controller.api;

import com.ssafy.be.domain.notification.dto.response.NotificationPageResponse;
import com.ssafy.be.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.http.ResponseEntity;

@Tag(name = "Notification", description = "알림 API")
public interface NotificationApi {

    @Operation(
            summary = "알림 목록 조회",
            description = "커서(Cursor) 기반 페이징을 사용하여 알림 목록을 조회합니다. <br>최초 요청 시 `cursor`를 생략하면 가장 최신 알림부터 조회되며, 다음 페이지 요청 시 응답으로 받은 `nextCursor` 값을 전달해주세요."
    )
    @ApiResponse(responseCode = "200", description = "알림 목록 조회 성공")
    ResponseEntity<NotificationPageResponse> getNotifications(
            String principal,
            @Parameter(description = "마지막으로 조회한 알림 ID (첫 요청 시 생략 가능)", example = "1710000000000") String cursor,
            @Parameter(description = "조회할 알림 개수", example = "20") int limit
    );

    @Operation(summary = "알림 읽음 처리")
    @ApiResponse(responseCode = "200", description = "읽음 처리 성공")
    @ApiResponse(
            responseCode = "404",
            description = "알림을 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    ResponseEntity<Void> markAsRead(
            String principal,
            @Parameter(description = "알림 ID") Long notifId
    );

    @Operation(summary = "읽지 않은 알림 수 조회")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    ResponseEntity<Integer> getUnreadCount(String principal);

    @Operation(summary = "모든 알림 읽음 처리")
    @ApiResponse(responseCode = "200", description = "전체 읽음 처리 성공")
    ResponseEntity<Map<String, Integer>> markAllAsRead(String principal);
}