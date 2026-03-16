package com.ssafy.be.domain.seller.controller;

import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.seller.controller.api.SellerApi;
import com.ssafy.be.domain.seller.dto.request.SellerProfileUpdateRequest;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.BiznoVerifyResponse;
import com.ssafy.be.domain.seller.dto.response.SellerProfileResponse;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.domain.seller.dto.response.SellerReputationResponse;
import com.ssafy.be.domain.seller.service.SellerService;
import com.ssafy.be.global.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sellers")
@RequiredArgsConstructor
public class SellerController implements SellerApi {

    private final SellerService sellerService;

    @PostMapping("/register")
    public ResponseEntity<SellerRegisterResponse> register(
            @AuthenticationPrincipal String userId,
            @RequestBody @Valid SellerRegisterRequest request) {
        Long user = Long.parseLong(userId);
        SellerRegisterResponse response = sellerService.register(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping("/{sellerId}/profile")
    public ResponseEntity<SellerProfileResponse> getProfile(@PathVariable Long sellerId) {
        return ResponseEntity.ok(sellerService.getProfile(sellerId));
    }

    @PatchMapping("/{sellerId}/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @PathVariable Long sellerId,
            @AuthenticationPrincipal String userId,
            @RequestBody SellerProfileUpdateRequest request) {

        sellerService.updateProfile(sellerId, Long.parseLong(userId), request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping("/verify-bizno")
    public ResponseEntity<BiznoVerifyResponse> verifyBizno(
            @RequestParam String bizno,
            @Parameter(description = "사업자 구분 (1: 개인, 2: 법인)")
            @RequestParam(defaultValue = "1") int gb) {
        return ResponseEntity.ok(sellerService.verifyBizno(bizno, gb));
    }

    @GetMapping("/{sellerId}/sold-auctions")
    public ResponseEntity<List<EscrowListResponse>> getAllSoldAuctions(
            @PathVariable Long sellerId
    ) {
        return ResponseEntity.ok(sellerService.getAllSoldAuctions(sellerId));
    }

    @GetMapping("/{sellerId}/reputation")
    public ResponseEntity<ApiResponse<SellerReputationResponse>> getReputation(
            @PathVariable Long sellerId,
            @AuthenticationPrincipal String principal) {

        Long requestUserId = principal != null ? Long.parseLong(principal) : null;
        return ResponseEntity.ok(ApiResponse.success(sellerService.getReputation(sellerId, requestUserId)));
    }
}