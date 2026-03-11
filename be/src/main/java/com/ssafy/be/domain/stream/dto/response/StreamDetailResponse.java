package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StartType;
import java.time.LocalDateTime;

public record StreamDetailResponse(
        Long streamId,
        String title,
        Category category,
        String thumbnail,
        LocalDateTime scheduledAt,
        StartType startType,
        String notice,
        boolean isLive,
        LocalDateTime createdAt) {
}
