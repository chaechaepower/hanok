package com.ssafy.be.domain.item.dto.response;

import com.ssafy.be.domain.auction.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;
import com.ssafy.be.domain.item.entity.ItemStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ItemSummaryResponse(
        Long itemId,
        String name,
        String description,
        List<String> tags,
        String image1,
        Long startPrice,
        Long bidUnit,
        Integer auctionDuration,
        ItemCondition itemCondition,
        Category category,
        AuctionType auctionType,
        ItemStatus status,
        LocalDateTime createdAt
) {}
