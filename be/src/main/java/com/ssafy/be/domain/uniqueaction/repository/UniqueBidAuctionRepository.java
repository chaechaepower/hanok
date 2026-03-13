package com.ssafy.be.domain.uniqueaction.repository;

import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuction;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UniqueBidAuctionRepository extends JpaRepository<UniqueBidAuction, Long> {
    Optional<UniqueBidAuction> findByAuctionId(long auctionId);
    Optional<UniqueBidAuction> findByAuction_Stream_IdAndStatus(Long streamId, UniqueBidStatus status);
}
