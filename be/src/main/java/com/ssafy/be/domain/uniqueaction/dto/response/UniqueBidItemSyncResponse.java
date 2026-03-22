package com.ssafy.be.domain.uniqueaction.dto.response;

import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.ItemCondition;
import java.util.List;
import lombok.Builder;

@Builder
public record UniqueBidItemSyncResponse(
        List<ItemInfo> items
) {
    @Builder
    public record ItemInfo(
            Long auctionId,
            String itemName,
            String description,
            List<String> images,
            Long minPrice,
            Long maxPrice,
            AuctionType auctionType,
            Integer auctionTime,
            AuctionStatus auctionStatus,
            Long finalPrice,
            ItemCondition itemCondition
    ) {}
}
