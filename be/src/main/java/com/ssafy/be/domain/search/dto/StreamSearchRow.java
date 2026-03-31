package com.ssafy.be.domain.search.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record StreamSearchRow(
        Long streamId,
        String title,
        String thumbnail,
        String status,
        LocalDateTime scheduledAt,
        Integer viewerCount,
        String category,
        Long sellerId,
        String shopName,
        String sellerProfileImageUri,
        String matchType
) {}