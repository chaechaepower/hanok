package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StreamStatus;

import java.time.LocalDateTime;

public record StreamListItemResponse(
        Long streamId,
        String title,
        Category category,
        String thumbnailUri,
        StreamStatus streamStatus,
        long viewerCount,
        LocalDateTime scheduledAt,
        LocalDateTime startedAt,
        StreamSellerResponse seller) {
}
