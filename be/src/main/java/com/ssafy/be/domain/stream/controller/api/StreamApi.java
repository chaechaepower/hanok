package com.ssafy.be.domain.stream.controller.api;

import com.ssafy.be.domain.stream.dto.request.StreamListRequest;
import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;
import com.ssafy.be.domain.stream.dto.request.StreamUpdateRequest;
import com.ssafy.be.domain.stream.dto.response.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Stream", description = "방송 API")
public interface StreamApi {

    // ===================== 판매자용 =====================

    @Operation(summary = "방송 등록", description = "판매자 전용 - 방송 등록 및 경매 물품 등록")
    ResponseEntity<StreamRegisterResponse> register(
            String userId, StreamRegisterRequest request, MultipartFile thumbnail);

    @Operation(summary = "방송 수정", description = "판매자 전용 - 본인 방송만 수정 가능")
    ResponseEntity<StreamRegisterResponse> update(
            String userId, Long streamId, StreamUpdateRequest request, MultipartFile thumbnail);

    @Operation(summary = "방송 삭제", description = "판매자 전용 - 본인 방송만 삭제 가능")
    ResponseEntity<Void> delete(String userId, Long streamId);

    @Operation(summary = "방송 시작", description = "판매자 전용 - 방송 상태를 LIVE로 변경")
    ResponseEntity<Void> startStream(String userId, Long streamId);

    @Operation(summary = "방송 종료", description = "판매자 전용 - 방송 상태를 ENDED로 변경")
    ResponseEntity<Void> endStream(String userId, Long streamId);

    @Operation(summary = "방송 단건 조회", description = "판매자 전용 - 본인 방송 상세 조회")
    ResponseEntity<StreamDetailResponse> getStream(String userId, Long streamId);

    // ===================== 공통 =====================

    @Operation(summary = "방송 입장", description = "판매자/시청자 공통 - 방송 상세 정보 + LiveKit 토큰 반환")
    ResponseEntity<StreamEnterResponse> enterStream(String userId, Long streamId);

    @Operation(summary = "방송 목록 조회", description = "LIVE/SCHEDULED 상태 필터, 카테고리/정렬 지원")
    ResponseEntity<Page<StreamListItemResponse>> getStreamList(StreamListRequest request);

    @Operation(summary = "예정 방송 목록 조회", description = "로그인한 사용자(userId)가 판매자인 LIVE + SCHEDULED 방송만 슬라이스 조회")
    ResponseEntity<ScheduledStreamListResponse> getScheduledStreamList(String userId, int page, int size);

}