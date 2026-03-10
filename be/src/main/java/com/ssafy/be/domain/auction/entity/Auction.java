package com.ssafy.be.domain.auction.entity;

import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.stream.entity.Stream;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.LIVE;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long finalPrice;

    @Enumerated(EnumType.STRING)
    private AuctionStatus auctionStatus;

    @Enumerated(EnumType.STRING)
    private AuctionType auctionType;

    private String startedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id")
    private Stream stream;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @Builder
    private Auction(AuctionStatus auctionStatus,
                    Long finalPrice,
                    AuctionType auctionType,
                    String startedAt,
                    Stream stream,
                    Item item) {
        this.auctionStatus = auctionStatus;
        this.finalPrice = finalPrice;
        this.auctionType = auctionType;
        this.startedAt = startedAt;
        this.stream = stream;
        this.item = item;
    }

    public void startAuction(String startedAt) {
        this.auctionStatus = LIVE;
        this.startedAt = startedAt;
    }
}
