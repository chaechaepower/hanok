package com.ssafy.be.domain.search.dto;

public record StreamSearchRow(
        Long streamId,
        String title,
        String thumbnail,
        String status,
        String scheduledAt,
        Integer viewerCount,
        String category,
        Long sellerId,
        String sellerNickname,
        String sellerProfileImageUri
) {}