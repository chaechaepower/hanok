package com.ssafy.be.domain.seller.controller.api;

import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.seller.dto.request.SellerProfileUpdateRequest;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.BiznoVerifyResponse;
import com.ssafy.be.domain.seller.dto.response.SellerProfileResponse;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.domain.seller.dto.response.SellerReputationResponse;
import com.ssafy.be.global.common.response.ApiResponse;
import com.ssafy.be.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Seller", description = "판매자 API")
public interface SellerApi {

    @Operation(summary = "판매자 등록")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "판매자 등록 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "409",
            description = "이미 판매자로 등록된 사용자",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    ResponseEntity<SellerRegisterResponse> register(Long userId, SellerRegisterRequest request);

    @Operation(summary = "판매자 프로필 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "판매자 없음",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @GetMapping("/{sellerId}/profile")
    ResponseEntity<SellerProfileResponse> getProfile(@PathVariable Long sellerId);

    @Operation(summary = "판매자 프로필 수정")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "본인 아님",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @PatchMapping("/{sellerId}/profile")
    ResponseEntity<ApiResponse<Void>> updateProfile(
            @PathVariable Long sellerId,
            @AuthenticationPrincipal String userId,
            @RequestBody SellerProfileUpdateRequest request
    );

    @Operation(summary = "사업자번호 인증")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "인증 성공")
    @GetMapping("/verify-bizno")
    ResponseEntity<BiznoVerifyResponse> verifyBizno(
            @RequestParam String bizno,
            @Parameter(description = "사업자 구분 (1: 개인, 2: 법인)")
            @RequestParam(defaultValue = "1") int gb);

    @Operation(summary = "판매자 낙찰 이력 조회", description = "특정 판매자의 낙찰된 경매 목록을 조회합니다.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/{sellerId}/sold-auctions")
    ResponseEntity<List<EscrowListResponse>> getAllSoldAuctions(@PathVariable Long sellerId);

    @Operation(summary = "판매자 평판 조회", description = "본인 또는 관리자는 상세 정보 포함, 타인은 공개 정보만 반환")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/{sellerId}/reputation")
    ResponseEntity<ApiResponse<SellerReputationResponse>> getReputation(
            @PathVariable Long sellerId,
            @AuthenticationPrincipal String principal);
}