package com.ssafy.be.domain.auction.repository;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
<<<<<<< be/src/main/java/com/ssafy/be/domain/auction/repository/AuctionRepository.java
import com.ssafy.be.domain.item.entity.ItemStatus;
=======
import jakarta.persistence.LockModeType;
>>>>>>> be/src/main/java/com/ssafy/be/domain/auction/repository/AuctionRepository.java
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    @Query("""
            SELECT a FROM Auction a
            JOIN FETCH a.item i
            WHERE i.seller.id = :sellerId AND i.status = :status
            """)
    List<Auction> findAllBySellerIdAndItemStatus(
            @Param("sellerId") Long sellerId,
            @Param("status") ItemStatus status);

// 유일 경매 집계 시 동시 중복 호출 방지용 비관적 락 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    Optional<Auction> findByIdWithLock(@Param("id") Long id);

}