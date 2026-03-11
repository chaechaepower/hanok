package com.ssafy.be.domain.seller.controller.api;

import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.SellerProfileResponse;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

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
}