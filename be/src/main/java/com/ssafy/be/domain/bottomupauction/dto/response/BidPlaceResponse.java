package com.ssafy.be.domain.bottomupauction.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record BidPlaceResponse(
        BidInfoDto bidInfo,
        SnipingTimerDto snipingTimer
) {
    @Builder
    public record BidInfoDto(
            String nickname,
            Long amount,
            LocalDateTime placedAt
    ) { }

    @Builder
    public record SnipingTimerDto(
            Integer durationSeconds,
            String serverNow,
            String serverStartedAt
    ) { }
}
