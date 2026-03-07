package com.ssafy.be.domain.wallet.controller;

import com.ssafy.be.domain.wallet.controller.api.WalletApi;
import com.ssafy.be.global.common.response.ApiResponse;
import com.ssafy.be.domain.wallet.service.WalletService;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCompleteRequest;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCreateRequest;
import com.ssafy.be.domain.wallet.dto.response.WalletChargeCreateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("/api/v1/wallet")
@RestController
public class WalletController implements WalletApi {
    private final WalletService walletService;

    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "사전등록 성공")
    @PostMapping("/charges")
    public ResponseEntity<?> createWalletCharge(
            @RequestBody WalletChargeCreateRequest request,
            @AuthenticationPrincipal String principal
    ) {
        WalletChargeCreateResponse response = walletService.createWalletCharge(request, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/charges/complete")
    public ResponseEntity<?> completeWalletCharge(
            @RequestBody WalletChargeCompleteRequest request,
            @AuthenticationPrincipal String principal
    ) {
        walletService.completeWalletCharge(request, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/charges/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String body,
            @RequestHeader("webhook-id") String webhookId,
            @RequestHeader("webhook-timestamp") String webhookTimestamp,
            @RequestHeader("webhook-signature") String webhookSignature
    ) {
        walletService.handleWebhook(body, webhookId, webhookTimestamp, webhookSignature);
        return ResponseEntity.ok(ApiResponse.success());
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }
}
