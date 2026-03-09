package com.ssafy.be.domain.auction.entity;

import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.stream.entity.Stream;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int currentPrice;

    @Enumerated(EnumType.STRING)
    private AuctionStatus auctionStatus;

    @Enumerated(EnumType.STRING)
    private AuctionType auctionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id")
    private Stream stream;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @Builder
    private Auction(AuctionStatus auctionStatus,
                   int currentPrice,
                   AuctionType auctionType,
                   Stream stream,
                   Item item) {
        this.auctionStatus = auctionStatus;
        this.currentPrice = currentPrice;
        this.auctionType = auctionType;
        this.stream = stream;
        this.item = item;
    }
}
