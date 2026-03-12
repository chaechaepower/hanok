package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.item.entity.Category;
import java.util.List;

public record StreamEnterResponse(
        Long streamId,
        String title,
        Category category,
        StreamStatus status,
        String notice,
        SellerInfo seller,
        long viewerCount,
        List<TopBidder> topBidders
) {
    public record SellerInfo(
            Long sellerId,
            String nickname,
            String profileImage
    ) {}

    public record TopBidder(
            int rank,
            String nickname,
            Long amount
    ) {}
}