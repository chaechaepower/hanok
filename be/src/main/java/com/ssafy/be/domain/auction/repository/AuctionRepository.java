package com.ssafy.be.domain.auction.repository;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByStreamId(Long streamId);
    Optional<Auction> findByStreamIdAndAuctionStatus(Long streamId, AuctionStatus auctionStatus);

    @Modifying
    void deleteByStreamId(Long streamId);

    void deleteByItemId(Long itemId);
    Optional<Auction> findByItemId(Long itemId);

    @Query("SELECT a FROM Auction a JOIN FETCH a.bottomUpAuctionDetail WHERE a.id = :id")
    Optional<Auction> findByIdWithBottomUpDetail(@Param("id") Long id);

}