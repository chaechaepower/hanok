package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import java.time.LocalDateTime;

public record ScheduledStreamResponse(
        Long streamId,
        String shopName,
        String title,
        String category,
        String thumbnail,
        LocalDateTime scheduledAt,
        StreamStatus state
) {
    public static ScheduledStreamResponse from(Stream stream) {
        return new ScheduledStreamResponse(
                stream.getId(),
                null,
                stream.getTitle(),
                stream.getCategory().name(),
                stream.getThumbnail(),
                stream.getScheduledAt(),
                stream.getStatus()
        );
    }
}