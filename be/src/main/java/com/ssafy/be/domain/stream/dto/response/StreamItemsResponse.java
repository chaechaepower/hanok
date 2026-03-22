package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemCondition;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

public record StreamItemsResponse(List<StreamItemResponse> items) {

    public record StreamItemResponse(
            Long auctionId,
            String itemName,
            List<String> images,
            AuctionType auctionType,
            AuctionStatus auctionStatus,
            Long finalPrice,
            ItemCondition itemCondition,
            BottomUpAuctionInfo bottomUp,
            UniqueTopAuctionInfo uniqueTop
    ) {
        public static StreamItemResponse from(Auction auction) {
            Item item = auction.getItem();

            List<String> images = Stream.of(item.getImage1(), item.getImage2(), item.getImage3())
                    .filter(Objects::nonNull)
                    .toList();

            return new StreamItemResponse(
                    auction.getId(),
                    item.getName(),
                    images,
                    auction.getAuctionType(),
                    auction.getAuctionStatus(),
                    auction.getFinalPrice(),
                    item.getItemCondition(),
                    auction.getBottomUpAuctionDetail() == null
                            ? null
                            : new BottomUpAuctionInfo(
                                    auction.getBottomUpAuctionDetail().getStartPrice(),
                                    auction.getBottomUpAuctionDetail().getBidUnit()
                            ),
                    auction.getUniqueBidAuctionDetail() == null
                            ? null
                            : new UniqueTopAuctionInfo(
                                    auction.getUniqueBidAuctionDetail().getMinPrice(),
                                    auction.getUniqueBidAuctionDetail().getMaxPrice()
                            )
            );
        }

        public record BottomUpAuctionInfo(
                Long startPrice,
                Long bidUnit
        ) {}

        public record UniqueTopAuctionInfo(
                Long minPrice,
                Long maxPrice
        ) {}
    }
}