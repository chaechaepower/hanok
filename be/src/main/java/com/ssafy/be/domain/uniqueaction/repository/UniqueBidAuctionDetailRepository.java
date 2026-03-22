package com.ssafy.be.domain.uniqueaction.repository;


import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuctionDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UniqueBidAuctionDetailRepository extends JpaRepository<UniqueBidAuctionDetail, Long> {
    Optional<UniqueBidAuctionDetail> findByAuction_Id(Long auctionId);
}
