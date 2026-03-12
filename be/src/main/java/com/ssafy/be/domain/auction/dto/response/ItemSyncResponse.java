package com.ssafy.be.domain.auction.dto.response;

import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.item.entity.ItemCondition;

import java.util.List;

import lombok.Builder;

@Builder
public record ItemSyncResponse(
        List<ItemInfo> items
) {
    @Builder
    public record ItemInfo(
            Long auctionId,
            String itemName,
            String image,
            Long startPrice,
            AuctionStatus auctionStatus,
            Long finalPrice,
            ItemCondition itemCondition
    ) {}
}
