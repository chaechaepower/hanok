package com.ssafy.be.domain.tradereport.api;

import com.ssafy.be.domain.tradereport.entity.TradeType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@Tag(name = "Trade Report", description = "거래 보고서 API")
public interface TradeReportApi {

    @Operation(summary = "거래 내역 조회", description = "거래 타입별로 거래 내역을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "400", description = "유효하지 않은 거래 타입")
    ResponseEntity<?> getAllTradeReports(
            @Parameter(description = "거래 타입 (예: CHARGE, WITHDRAW, SETTLEMENT)", required = true) TradeType type,
            @AuthenticationPrincipal @Parameter(hidden = true) String principal
    );
}
