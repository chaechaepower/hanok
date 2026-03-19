package com.ssafy.be.domain.uniqueaction.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UniqueBidAuctionRepository extends JpaRepository<UniqueBidAuction, Long> {
    Optional<UniqueBidAuction> findByAuction_Id(long auctionId);
    Optional<UniqueBidAuction> findByAuction_Stream_IdAndStatus(Long streamId, UniqueBidStatus status);
}
