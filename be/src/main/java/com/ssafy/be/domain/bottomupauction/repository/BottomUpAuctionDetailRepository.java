package com.ssafy.be.domain.bottomupauction.repository;

import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BottomUpAuctionDetailRepository extends JpaRepository<BottomUpAuctionDetail, Long> {
    Optional<BottomUpAuctionDetail> findByAuction_Id(Long auctionId);
}
