package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.item.entity.Category;
import java.time.LocalDateTime;

public record StreamListItemResponse(
        Long streamId,
        String title,
        Category category,
        String thumbnailUri,
        boolean isLive,
        long viewerCount,
        LocalDateTime scheduledAt,
        LocalDateTime startedAt,
        StreamSellerResponse seller) {
}
