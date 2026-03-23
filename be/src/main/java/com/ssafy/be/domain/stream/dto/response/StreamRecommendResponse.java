package com.ssafy.be.domain.stream.dto.response;


import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StreamStatus;

import java.time.LocalDateTime;

public record StreamRecommendResponse(
        Long streamId,
        String title,
        Category category,
        String thumbnail,
        StreamStatus status,
        long viewerCount,
        LocalDateTime startedAt,
        StreamSellerResponse seller
) {}

