package com.ssafy.be.domain.search.dto.response;

import com.ssafy.be.domain.stream.entity.StreamStatus;
import lombok.Builder;

import java.util.List;

@Builder
public record StreamSearchResult(
        Long streamId,
        String title,
        String thumbnail,
        StreamStatus status,
        String scheduledAt,
        Integer viewerCount,
        String category,
        SellerInfo seller,
        List<MatchReason> matchReasons
) {
    public void addReason(MatchReason reason) {
        matchReasons.add(reason);
    }
}
