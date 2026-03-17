package com.ssafy.be.domain.escrow.repository;

import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
            join fetch e.shippingAddress
            join fetch e.seller s
            join fetch s.user u
            where e.id = :escrowId
            and u.id = :userId
            """)
    Optional<Escrow> findByIdAndSellerUserId(@Param("escrowId") Long escrowId, @Param("userId") Long userId);

    @Query("""
            select e from Escrow e
            join fetch e.auction a
            join fetch a.item
            where e.seller.id = :sellerId
            """)
    List<Escrow> findBySellerId(Long sellerId);

    long countBySellerIdAndEscrowStatus(Long sellerId, EscrowStatus status);
}

