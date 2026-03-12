package com.ssafy.be.domain.notice.controller.api;

import com.ssafy.be.domain.notice.dto.request.NoticeCreateRequest;
import com.ssafy.be.domain.notice.dto.request.NoticeUpdateRequest;
import com.ssafy.be.domain.notice.dto.response.NoticeResponse;
import com.ssafy.be.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Tag(name = "Seller Notice", description = "판매자 공지사항 API")
public interface SellerNoticeApi {

    @Operation(summary = "공지사항 작성")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "공지사항 작성 성공")
    ResponseEntity<NoticeResponse> createNotice(Long sellerId, NoticeCreateRequest request);

    @Operation(summary = "공지사항 목록 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "목록 조회 성공")
    ResponseEntity<List<NoticeResponse>> getNotices(Long sellerId);

    @Operation(summary = "공지사항 단건 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "단건 조회 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", description = "공지사항을 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    ResponseEntity<NoticeResponse> getNotice(Long sellerId, Long noticeId);

    @Operation(summary = "공지사항 수정")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "공지사항 수정 성공")
    ResponseEntity<NoticeResponse> updateNotice(Long sellerId, Long noticeId, NoticeUpdateRequest request);

    @Operation(summary = "공지사항 삭제")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "공지사항 삭제 성공")
    ResponseEntity<Void> deleteNotice(Long sellerId, Long noticeId);
}