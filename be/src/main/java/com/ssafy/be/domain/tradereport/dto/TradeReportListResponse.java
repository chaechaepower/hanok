package com.ssafy.be.domain.tradereport.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record TradeReportListResponse(
        String itemName,
        Long amount,
        LocalDateTime createdAt
) {
}
