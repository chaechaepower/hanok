package com.ssafy.be.domain.bottomupauction.entity;

import com.ssafy.be.domain.auction.entity.Auction;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BottomUpAuctionDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long startPrice;

    private Long bidUnit;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", unique = true)
    private Auction auction;

    @Builder
    public BottomUpAuctionDetail(Long startPrice, Long bidUnit, Auction auction) {
        this.startPrice = startPrice;
        this.bidUnit = bidUnit;
        this.auction = auction;
    }

    public boolean isBelowStartPrice(Long amount) {
        return startPrice > amount;
    }

    public void updateSchedule(Long startPrice, Long bidUnit) {
        this.startPrice = startPrice;
        this.bidUnit = bidUnit;
    }
}
