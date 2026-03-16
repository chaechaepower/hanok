package com.ssafy.be.domain.search.dto.response;

import lombok.Builder;

@Builder
public record MatchReason(
        MatchType type,
        String matchedValue
) {
}
