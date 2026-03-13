package com.ssafy.be.domain.uniqueaction.dto.response;

import lombok.Builder;

@Builder
public record UniqueBidSyncResponse(
        Long minPrice,
        Long maxPrice,
        Long bidUnit,
        int durationSeconds,
        String serverNow,
        String serverStartedAt,
        long participantCount
) {}
