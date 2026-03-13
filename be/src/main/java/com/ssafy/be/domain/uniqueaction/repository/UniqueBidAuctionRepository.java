package com.ssafy.be.domain.uniqueaction.repository;

import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UniqueBidAuctionRepository extends JpaRepository<UniqueBidAuction, Long> {
    Optional<UniqueBidAuction> findByAuctionId(long auctionId);
}
