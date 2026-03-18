package com.ssafy.be.domain.auction.dto.response;

import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.item.entity.AuctionType;
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
            String description,
            List<String> images,
            Long startPrice,
            AuctionType auctionType,
            Integer auctionTime, // 엔티티에서 네이밍은 auctionDuration임. 프론트 협의
            Long bidUnit,
            AuctionStatus auctionStatus,
            Long finalPrice,
            ItemCondition itemCondition
    ) {}
}
