package com.ssafy.be.domain.stream.controller.api;

import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;
import com.ssafy.be.domain.stream.dto.request.StreamUpdateRequest;
import com.ssafy.be.domain.stream.dto.response.StreamRegisterResponse;
import com.ssafy.be.domain.stream.dto.response.StreamTokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Stream", description = "방송 API")
public interface StreamApi {

    @Operation(summary = "방송 등록")
    ResponseEntity<StreamRegisterResponse> register(Long userId, StreamRegisterRequest request, MultipartFile thumbnail);

    @Operation(summary = "방송 수정")
    ResponseEntity<StreamRegisterResponse> update(Long userId, Long streamId, StreamUpdateRequest request, MultipartFile thumbnail);

    @Operation(summary = "방송 삭제")
    ResponseEntity<Void> delete(Long userId, Long streamId);

    @Operation(summary = "LiveKit 토큰 발급")
    ResponseEntity<StreamTokenResponse> generateToken(Long userId, Long streamId);
}