package com.ssafy.be.domain.wallet.controller.api;

import com.ssafy.be.domain.wallet.dto.request.WalletChargeCompleteRequest;
import com.ssafy.be.domain.wallet.dto.request.WalletChargeCreateRequest;
import com.ssafy.be.domain.wallet.dto.request.WithdrawRequestCreateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@Tag(name = "Wallet", description = "가상머니 API")
public interface WalletApi {

    @Operation(summary = "가상머니 충전 사전등록", description = "PortOne 결제창 호출 전 서버에 결제 정보를 사전등록합니다.")
    @ApiResponse(responseCode = "200", description = "사전등록 성공")
    @ApiResponse(responseCode = "400", description = "최소 충전 금액 미만")
    ResponseEntity<?> createWalletCharge(
            @RequestBody WalletChargeCreateRequest request,
            @AuthenticationPrincipal String principal
    );

    @Operation(summary = "가상머니 충전 완료 처리", description = "PortOne 결제 완료 후 잔액을 증가시킵니다.")
    @ApiResponse(responseCode = "200", description = "충전 완료")
    @ApiResponse(responseCode = "400", description = "결제 금액 불일치")
    @ApiResponse(responseCode = "403", description = "본인의 결제가 아님")
    @ApiResponse(responseCode = "404", description = "결제 내역 없음")
    ResponseEntity<?> completeWalletCharge(
            @RequestBody WalletChargeCompleteRequest request,
            @AuthenticationPrincipal String principal
    );

    @Operation(summary = "가상머니 조회", description = "가상머니 잔액 및 예치금 정보를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    ResponseEntity<?> getWalletSummary(
            @AuthenticationPrincipal String principal
    );

    @Operation(summary = "출금 요청", description = "가상머니 출금을 요청합니다.")
    @ApiResponse(responseCode = "200", description = "출금 요청 완료")
    @ApiResponse(responseCode = "400", description = "최소 출금 금액 미만 또는 잔액 부족")
    ResponseEntity<?> createWithdrawRequest(
            @RequestBody WithdrawRequestCreateRequest request,
            @AuthenticationPrincipal String principal
    );

    @Operation(summary = "[PortOne] 웹훅 수신(직접 호출 X)", description = "PortOne 결제 웹훅을 수신하여 결제 상태를 동기화합니다.")
    @ApiResponse(responseCode = "200", description = "웹훅 처리 완료")
    ResponseEntity<?> handleWebhook(
            @RequestBody String body,
            @RequestHeader("webhook-id") String webhookId,
            @RequestHeader("webhook-timestamp") String webhookTimestamp,
            @RequestHeader("webhook-signature") String webhookSignature
    );
}
