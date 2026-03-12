package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
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
            Long startPrice,
            AuctionStatus auctionStatus,
            Long finalPrice,
            ItemCondition itemCondition
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
                    item.getStartPrice(),
                    auction.getAuctionStatus(),
                    auction.getFinalPrice(),
                    item.getItemCondition()
            );
        }
    }
}