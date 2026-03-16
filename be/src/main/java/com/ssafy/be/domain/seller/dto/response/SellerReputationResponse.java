package com.ssafy.be.domain.seller.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 응답에서 제외
public record SellerReputationResponse(
        Long followerCount,
        // 아래는 본인/관리자만
        Long totalTrades,
        Double completionRate,
        Long cancelCount,
        Double avgShipDays
) {}