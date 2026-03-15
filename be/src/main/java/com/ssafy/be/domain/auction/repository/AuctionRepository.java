package com.ssafy.be.domain.auction.repository;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByStreamId(Long streamId);
    Optional<Auction> findByItemId(Long itemId);
    Optional<Auction> findByStreamIdAndAuctionStatus(Long streamId, AuctionStatus auctionStatus);
    List<Auction> findByItemIdIn(List<Long> itemIds);
}