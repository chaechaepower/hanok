package com.ssafy.be.domain.tradereport.controller;

import com.ssafy.be.domain.tradereport.api.TradeReportApi;
import com.ssafy.be.domain.tradereport.dto.TradeReportListResponse;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.tradereport.service.TradeReportService;
import com.ssafy.be.global.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RequestMapping("/api/v1/trade-reports")
@RestController
public class TradeReportController implements TradeReportApi {
    private final TradeReportService tradeReportService;

    @GetMapping
    public ResponseEntity<?> getAllTradeReports(
            @RequestParam(required = true) TradeType type,
            @AuthenticationPrincipal String principal
    ) {
        List<TradeReportListResponse> response = tradeReportService.getAllTradeReports(type, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }
}
