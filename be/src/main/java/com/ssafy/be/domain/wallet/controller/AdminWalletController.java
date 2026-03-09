package com.ssafy.be.domain.wallet.controller;

import com.ssafy.be.domain.wallet.controller.api.AdminWalletApi;
import com.ssafy.be.domain.wallet.dto.response.WithdrawRequestResponse;
import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import com.ssafy.be.domain.wallet.service.WalletQueryService;
import com.ssafy.be.domain.wallet.service.WalletWithdrawService;
import com.ssafy.be.global.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/withdraws")
@RestController
public class AdminWalletController implements AdminWalletApi {
    private final WalletQueryService walletQueryService;
    private final WalletWithdrawService walletWithdrawService;

    @GetMapping("")
    public ResponseEntity<?> getAllWithdrawRequests(
            @RequestParam(required = false) WithdrawStatus status
    ) {
        List<WithdrawRequestResponse> response = walletQueryService.getAllWithdrawRequests(status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{withdrawId}/complete")
    public ResponseEntity<?> completeWithdraw(
            @PathVariable Long withdrawId
    ) {
        walletWithdrawService.completeWithdraw(withdrawId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
