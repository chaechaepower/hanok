package com.ssafy.be.domain.uniqueaction.dto.response;

import com.ssafy.be.domain.uniqueaction.dto.model.DuplicatePriceInfo;
import lombok.Builder;

import java.util.List;

@Builder
public record UniqueAuctionResultResponse(
        Boolean isWon,
        Long winnerPrice,
        List<DuplicatePriceInfo> topDuplicates
) {
}
