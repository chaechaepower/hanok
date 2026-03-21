package com.ssafy.be.domain.escrow.repository;

import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, Long> {

    @Query("""
            select e from Escrow e
            join fetch e.auction a
            join fetch a.item
            where e.seller.user.id = :userId
            """)
    List<Escrow> findAllBySellerUserId(@Param("userId") Long userId);

    @Query("""
            select e from Escrow e
            join fetch e.auction a
            join fetch a.item
            where e.buyer.id = :userId
            order by e.createdAt desc
            """)
    List<Escrow> findAllByBuyerUserId(@Param("userId") Long userId);


    @Query("""
            select e from Escrow e
            join fetch e.auction a
            join fetch a.item
            where e.seller.id = :sellerId
            """)
    List<Escrow> findBySellerId(Long sellerId);

    long countBySellerIdAndEscrowStatus(Long sellerId, EscrowStatus status);

    // 1. 에스크로 상태별 금액 합계 구하기
    @Query("SELECT e.escrowStatus, SUM(e.winningPrice) " +
            "FROM Escrow e " +
            "WHERE e.seller.id = :sellerId " +
            "GROUP BY e.escrowStatus")
    List<Object[]> findSettlementSummaryBySellerId(@Param("sellerId") Long sellerId);

    // 2. 이번 달 일별 매출액 구하기 (별칭 에러 해결)
    @Query("SELECT FUNCTION('DATE_FORMAT', e.createdAt, '%Y-%m-%d') as saleDate, SUM(e.winningPrice) " +
            "FROM Escrow e " +
            "WHERE e.seller.id = :sellerId " +
            "AND e.escrowStatus = 'COMPLETED' " +
            "AND e.createdAt >= :startDate " +
            "GROUP BY FUNCTION('DATE_FORMAT', e.createdAt, '%Y-%m-%d') " +
            "ORDER BY FUNCTION('DATE_FORMAT', e.createdAt, '%Y-%m-%d') ASC")
    List<Object[]> findDailySalesBySellerId(@Param("sellerId") Long sellerId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT e.auction.item.category, COUNT(e), SUM(e.winningPrice) " +
            "FROM Escrow e " +
            "WHERE e.seller.id = :sellerId AND e.escrowStatus = 'COMPLETED' " +
            "GROUP BY e.auction.item.category")
    List<Object[]> findCategoryStatsBySellerId(@Param("sellerId") Long sellerId);
}

