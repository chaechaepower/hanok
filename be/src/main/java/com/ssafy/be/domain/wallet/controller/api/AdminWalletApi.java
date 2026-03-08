package com.ssafy.be.domain.wallet.controller.api;

import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Admin Wallet", description = "[관리자] 가상머니 API")
public interface AdminWalletApi {

    @Operation(summary = "출금 요청 목록 조회", description = "출금 요청 목록을 조회합니다. (status 필터링)")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    ResponseEntity<?> getAllWithdrawRequests(
            @RequestParam(required = false) WithdrawStatus status
    );
}
