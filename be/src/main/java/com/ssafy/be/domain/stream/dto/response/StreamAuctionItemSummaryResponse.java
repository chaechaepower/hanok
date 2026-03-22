package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;
import com.ssafy.be.domain.item.entity.ItemStatus;

import java.time.LocalDateTime;
import java.util.List;

public record StreamAuctionItemSummaryResponse(
        Long itemId,
        String name,
        String description,
        List<String> tags,
        List<String> images,
        AuctionType auctionType,
        Integer auctionDuration,
        BottomUpAuctionInfo bottomUp,
        UniqueTopAuctionInfo uniqueTop,
        ItemCondition itemCondition,
        Category category,
        ItemStatus status,
        LocalDateTime createdAt
) {
    public record BottomUpAuctionInfo(
            Long startPrice,
            Long bidUnit
    ) {}

    public record UniqueTopAuctionInfo(
            Long minPrice,
            Long maxPrice
    ) {}
}
