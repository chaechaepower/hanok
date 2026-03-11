package com.ssafy.be.domain.seller.dto.response;

import java.time.LocalDateTime;

public record ScheduledStreamResponse(
        Long streamId,
        String title,
        String notice,
        String thumbnail,
        LocalDateTime scheduledAt
) {}