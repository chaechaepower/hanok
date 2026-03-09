package com.ssafy.be.domain.wallet.controller;

import com.ssafy.be.domain.wallet.controller.api.WalletApi;
import com.ssafy.be.domain.wallet.dto.request.WithdrawRequestCreateRequest;
import com.ssafy.be.domain.wallet.dto.response.WalletSummaryResponse;
import com.ssafy.be.domain.wallet.service.WalletQueryService;
import com.ssafy.be.domain.wallet.service.WalletWithdrawService;
import com.ssafy.be.global.common.response.ApiResponse;
import com.ssafy.be.domain.wallet.service.WalletChargeService;
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
    private final WalletChargeService walletChargeService;
    private final WalletWithdrawService walletWithdrawService;
    private final WalletQueryService walletQueryService;

    @PostMapping("/charges")
    public ResponseEntity<?> createWalletCharge(
            @RequestBody WalletChargeCreateRequest request,
            @AuthenticationPrincipal String principal
    ) {
        WalletChargeCreateResponse response = walletChargeService.createWalletCharge(request, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/charges/complete")
    public ResponseEntity<?> completeWalletCharge(
            @RequestBody WalletChargeCompleteRequest request,
            @AuthenticationPrincipal String principal
    ) {
        walletChargeService.completeWalletCharge(request, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping("")
    public ResponseEntity<?> getWalletSummary(
            @AuthenticationPrincipal String principal
    ) {
        WalletSummaryResponse response = walletQueryService.getWalletSummary(getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/withdrawals")
    public ResponseEntity<?> createWithdrawRequest(
            @RequestBody WithdrawRequestCreateRequest request,
            @AuthenticationPrincipal String principal
    ) {
        walletWithdrawService.requestWithdraw(request, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/charges/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String body,
            @RequestHeader("webhook-id") String webhookId,
            @RequestHeader("webhook-timestamp") String webhookTimestamp,
            @RequestHeader("webhook-signature") String webhookSignature
    ) {
        walletChargeService.handleWebhook(body, webhookId, webhookTimestamp, webhookSignature);
        return ResponseEntity.ok(ApiResponse.success());
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }
}
