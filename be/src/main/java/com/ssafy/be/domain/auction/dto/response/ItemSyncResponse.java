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
            Long auctionId,             // 공통
            String itemName,            // 공통
            String description,         // 공통
            List<String> images,        // 공통
            AuctionType auctionType,    // 타입 구분자 (BOTTOM_UP, UNIQUE_TOP)
            Integer auctionTime,        // 공통
            AuctionStatus auctionStatus,// 공통
            Long finalPrice,            // 공통
            ItemCondition itemCondition,// 공통

            Long bidUnit,    // 상향식(존재), 유일최고가(null)
            Long startPrice, // 상향식(존재), 유일최고가(null)
            Long minPrice,   // 상향식(null), 유일최고가(존재)
            Long maxPrice    // 상향식(null), 유일최고가(존재)
    ) {}
}
